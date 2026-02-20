const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const verifyFirebaseToken = require("./middleware/authMiddleware");
const Razorpay = require("razorpay");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

/**
 * Razorpay Configuration
 */
console.log('🔍 Checking Razorpay environment variables:');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_XXXXXXXXXXXXXXXXXXXXXXX') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.log('⚠️ Razorpay credentials not configured. Using test mode.');
}
/**
 * Nodemailer configuration for Email OTP (Gmail)
 */
console.log('🔍 Checking email environment variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

let transporter;
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Gmail Nodemailer initialized successfully');
} else {
  console.log('⚠️ Email credentials not configured. OTP will be printed to console for testing.');
}

console.log('📧 Email configured:', isEmailConfigured);

/**
 * Cloudinary configuration for image uploads
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Multer configuration for handling file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/**
 * Prisma 7 Initialization with PostgreSQL Adapter
 * The adapter handles the database connection through pg (node-postgres)
 */
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
});

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Backend + Socket + Neon is running 🚀");
});

/**
 * Firebase is disabled for now - private key appears corrupted
 * TODO: Update FIREBASE_PRIVATE_KEY in .env with valid credentials
 * and remove the is_firebase_enabled check
 */
global.is_firebase_enabled = false;

/**
 * POST /auth/me
 * Workflow:
 * 1. Verify Firebase token [cite: 9]
 * 2. Check if user exists in PostgreSQL [cite: 9]
 * 3. If not, create new record with the chosen role [cite: 10]
 */
app.post("/auth/me", verifyFirebaseToken, async (req, res) => {
  const { role, phone, name } = req.body || {};

  try {
    console.log("Auth/me called with req.user:", req.user);

    if (!req.user || !req.user.firebase_uid) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    // Use upsert to update if exists, create if doesn't
    // Check if user exists by email first (to handle different UIDs for same email)
    let user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (user) {
      // If they exist, update their Firebase UID to the current one
      const dataToUpdate = {
        firebase_uid: req.user.firebase_uid,
        phone: phone || undefined
      };

      // Only update role if explicitly provided (e.g. during Signup/Upgrade)
      if (role) {
        dataToUpdate.role = role;
      }

      // Update name if provided (during signup)
      if (name) {
        dataToUpdate.name = name;
      }

      user = await prisma.user.update({
        where: { email: req.user.email },
        data: dataToUpdate,
      });
    } else {
      // If they don't exist at all, create them
      user = await prisma.user.create({
        data: {
          firebase_uid: req.user.firebase_uid,
          email: req.user.email,
          phone: phone || null,
          role: role || "USER",
          name: name || null, // Include name during signup
        },
      });
    }

    console.log("✓ User synced to PostgreSQL:", user.email);
    res.status(200).json(user);
  } catch (error) {
    console.error("Database Sync Error:", error.message);
    console.error("Full error:", error);
    res
      .status(500)
      .json({ error: "Failed to sync with PostgreSQL: " + error.message });
  }
});

/**
 * Helper function to generate 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /auth/send-otp
 * Generate and send OTP email to user
 */
app.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Find or create user with OTP
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firebase_uid: `temp_${Date.now()}`, // Temp UID until Firebase signup
          otp_code: otp,
          otp_expiry: expiryTime,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          otp_code: otp,
          otp_expiry: expiryTime,
        },
      });
    }

    // Send OTP via email
    try {
      if (!isEmailConfigured) {
        console.log('📧 Email not configured. OTP for testing:', otp);
        console.log(`📝 For testing, use OTP: ${otp} for email: ${email}`);
      } else {
        console.log(`📧 Sending OTP to ${email} using Gmail`);
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "🔐 Your Email Verification OTP - Consultation Platform",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; text-align: center;">Email Verification</h2>
              <p style="color: #666;">Your One-Time Password (OTP) is:</p>
              <h1 style="color: #4CAF50; letter-spacing: 5px; text-align: center; font-size: 32px; margin: 20px 0;">${otp}</h1>
              <p style="color: #999; text-align: center;">This OTP will expire in 10 minutes.</p>
              <p style="color: #999; text-align: center;">Do not share this code with anyone.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from Consultation Platform.</p>
            </div>
          `,
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✓ OTP email sent to ${email}. OTP: ${otp}`);
      }
    } catch (emailError) {
      console.error(`❌ Email send failed:`, emailError.message);
      console.error(`❌ Full error:`, emailError);
      console.error(`🔧 Check: EMAIL_USER="${process.env.EMAIL_USER}", EMAIL_PASS set: ${!!process.env.EMAIL_PASS}`);
      console.log(`📝 For testing - OTP is: ${otp}`);
    }

    res.status(200).json({
      message: "OTP sent successfully",
      email: email,
    });
  } catch (error) {
    console.error("❌ OTP Send Error:", error.message);
    res.status(500).json({ error: "Failed to send OTP: " + error.message });
  }
});

/**
 * POST /auth/verify-otp
 * Verify OTP code entered by user
 */
app.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check OTP validity
    if (user.otp_code !== otp) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // Check OTP expiry
    if (new Date() > user.otp_expiry) {
      return res.status(401).json({ error: "OTP expired" });
    }

    // Mark email as verified and clear OTP
    const verifiedUser = await prisma.user.update({
      where: { email },
      data: {
        is_verified: true,
        otp_code: null,
        otp_expiry: null,
      },
    });

    res.status(200).json({
      message: "Email verified successfully",
      user: verifiedUser,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

/**
 * POST /consultant/register
 * Create a new consultant profile
 */
app.post("/consultant/register", verifyFirebaseToken, async (req, res) => {
  const { type, domain, bio, languages, hourly_price } = req.body;

  try {
    if (!domain || !hourly_price) {
      return res
        .status(400)
        .json({ error: "Domain and hourly_price are required" });
    }

    // Ensure user exists - try by firebase_uid first, then create if not found
    let user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      // If not found by firebase_uid, try to find by email and link them
      // Otherwise create a new user
      try {
        user = await prisma.user.findUnique({
          where: { email: req.user.email },
        });

        if (user && !user.firebase_uid) {
          // Update existing user with firebase_uid
          user = await prisma.user.update({
            where: { email: req.user.email },
            data: { firebase_uid: req.user.firebase_uid },
          });
        } else if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              firebase_uid: req.user.firebase_uid,
              email: req.user.email,
              role: "CONSULTANT",
            },
          });
        }
      } catch (err) {
        // If any error, try to get the user again
        user = await prisma.user.findUnique({
          where: { firebase_uid: req.user.firebase_uid },
        });
      }
    }

    if (!user) {
      return res.status(404).json({ error: "Could not create or find user" });
    }

    // Delete existing consultant profile if any (clean slate)
    await prisma.consultant.deleteMany({
      where: { userId: user.id }
    });

    // Create new consultant profile
    const consultant = await prisma.consultant.create({
      data: {
        userId: user.id,
        type: type || "Individual",
        domain,
        bio: bio || null,
        languages: languages || null,
        hourly_price: parseFloat(hourly_price),
        is_verified: false, // Admin needs to verify
      },
    });

    console.log(`✓ Consultant profile created for user ${user.email}`);
    res.status(201).json(consultant);
  } catch (error) {
    console.error("Consultant Registration Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to create consultant profile: " + error.message });
  }
});



/**
 * ================= SUPPORT ROUTES =================
 */

/**
 * POST /support
 * Create new support ticket
 */
app.post("/support", verifyFirebaseToken, async (req, res) => {
  const { subject, category, description } = req.body;

  try {
    if (!subject || !description) {
      return res.status(400).json({ error: "Subject and description are required" });
    }

    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let ticketData = {
      subject,
      category,
      description,
      status: "OPEN"
    };

    // 🏢 If Enterprise Owner → attach enterpriseId
    if (user.role === "ENTERPRISE_OWNER") {

      const enterprise = await prisma.enterprise.findUnique({
        where: { ownerId: user.id }
      });

      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      ticketData.enterpriseId = enterprise.id;

    } else {
      // 👤 Normal user ticket
      ticketData.userId = user.id;
    }

    const ticket = await prisma.supportTicket.create({
      data: ticketData
    });

    res.status(201).json(ticket);

  } catch (error) {
    console.error("Create Support Ticket Error:", error.message);
    res.status(500).json({ error: "Failed to create support ticket" });
  }
});

app.get("/support", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let whereCondition = {};

    if (user.role === "ENTERPRISE_OWNER") {

      const enterprise = await prisma.enterprise.findUnique({
        where: { ownerId: user.id }
      });

      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      whereCondition.enterpriseId = enterprise.id;

    } else {
      whereCondition.userId = user.id;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereCondition,
      orderBy: { created_at: "desc" }
    });

    res.status(200).json(tickets);

  } catch (error) {
    console.error("Get Support Tickets Error:", error.message);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});



/**
 * GET /consultant/profile
 * Get current user's consultant profile
 */
app.get("/consultant/profile", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { consultant: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.consultant) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    res.status(200).json(user.consultant);
  } catch (error) {
    console.error("Get Consultant Error:", error.message);
    res.status(500).json({ error: "Failed to fetch consultant profile" });
  }
});

/**
 * PUT /consultant/profile
 * Update consultant profile
 */
app.put("/consultant/profile", verifyFirebaseToken, async (req, res) => {
  const { type, domain, bio, languages, hourly_price, full_name } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { consultant: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.consultant) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    // Update both consultant and user records
    const updatedConsultant = await prisma.consultant.update({
      where: { id: user.consultant.id },
      data: {
        type: type || user.consultant.type,
        domain: domain || user.consultant.domain,
        bio: bio !== undefined ? bio : user.consultant.bio,
        languages:
          languages !== undefined ? languages : user.consultant.languages,
        hourly_price: hourly_price
          ? parseFloat(hourly_price)
          : user.consultant.hourly_price,
      },
    });

    // Update user's name if provided
    if (full_name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: full_name }
      });
    }

    console.log(`✓ Consultant profile updated for user ${user.email}`);
    res.status(200).json(updatedConsultant);
  } catch (error) {
    console.error("Update Consultant Error:", error.message);
    res.status(500).json({ error: "Failed to update consultant profile" });
  }
});


/**
 * POST /consultant/upload-profile-pic
 * Upload consultant profile picture to Cloudinary
 */
app.post('/consultant/upload-profile-pic', verifyFirebaseToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'consultancy-platform/profile-pics' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const uploadResult = await uploadPromise;
    const imageUrl = uploadResult.secure_url;

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { consultant: true }
    });

    if (!user || !user.consultant) {
      return res.status(404).json({ error: 'Consultant profile not found' });
    }

    // Update consultant with new profile picture
    const updatedConsultant = await prisma.consultant.update({
      where: { id: user.consultant.id },
      data: { profile_pic: imageUrl }
    });

    console.log(`✓ Profile picture uploaded for ${user.email}`);
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profile_pic: imageUrl,
      consultant: updatedConsultant
    });
  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ error: 'Failed to upload profile picture: ' + error.message });
  }
});

/**
 * POST /user/upload-profile-pic
 * Upload user profile picture to Cloudinary
 */
app.post('/user/upload-profile-pic', verifyFirebaseToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'consultancy-platform/user-profile-pics' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const uploadResult = await uploadPromise;
    const imageUrl = uploadResult.secure_url;

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user with new profile picture
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: imageUrl }
    });

    console.log(`✓ User profile picture uploaded for ${user.email}`);
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      avatar: imageUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ error: 'Failed to upload profile picture: ' + error.message });
  }
});

/**
 * GET /consultants
 * Get all consultants (with optional domain filter)
 */
app.get("/consultants", async (req, res) => {
  try {
    const { domain } = req.query;

    let consultants;
    if (domain) {
      consultants = await prisma.consultant.findMany({
        where: {
          domain: {
            contains: domain,
            mode: "insensitive",
          },
          is_verified: true, // Only show verified consultants
        },
        include: {
          user: {
            select: { email: true },
          },
        },
      });
    } else {
      consultants = await prisma.consultant.findMany({
        where: { is_verified: true },
        include: {
          user: {
            select: { email: true },
          },
        },
      });
    }

    res.status(200).json(consultants);
  } catch (error) {
    console.error("Get Consultants Error:", error.message);
    res.status(500).json({ error: "Failed to fetch consultants" });
  }
});

/**
 * GET /consultants/:id
 * Get single consultant details
 */
app.get("/consultants/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const consultant = await prisma.consultant.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    res.status(200).json(consultant);
  } catch (error) {
    console.error("Get Consultant Error:", error.message);
    res.status(500).json({ error: "Failed to fetch consultant" });
  }
});

/**
 * GET /wallet
 * Get user's wallet balance
 */
app.get("/wallet", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create wallet if it doesn't exist
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }

    res.status(200).json({
      balance: wallet.balance,
      user_id: user.id
    });
  } catch (error) {
    console.error("Get Wallet Error:", error.message);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

/**
 * GET /credit-packages
 * Get available credit packages
 */
app.get("/credit-packages", async (req, res) => {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { is_active: true },
      orderBy: { amount: 'asc' }
    });

    res.status(200).json(packages);
  } catch (error) {
    console.error("Get Credit Packages Error:", error.message);
    res.status(500).json({ error: "Failed to fetch credit packages" });
  }
});

/**
 * POST /payment/create-order
 * Create Razorpay order for payment
 */
app.post("/payment/create-order", verifyFirebaseToken, async (req, res) => {
  const { amount, package_id } = req.body;

  console.log('🧪 Create Order Request:', { amount, package_id, user: req.user });

  try {
    if (!amount || amount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!razorpay) {
      console.log('❌ Razorpay not initialized');
      return res.status(503).json({ error: "Payment service not configured" });
    }

    // Calculate bonus if package is specified
    let bonusAmount = 0;
    if (package_id) {
      console.log('🔍 Looking up package:', package_id);
      const creditPackage = await prisma.creditPackage.findUnique({
        where: { id: parseInt(package_id) }
      });
      console.log('📦 Found package:', creditPackage);
      if (creditPackage) {
        bonusAmount = creditPackage.bonus || 0;
      }
    }

    const totalAmount = amount + bonusAmount;
    const amountInPaise = totalAmount * 100; // Convert to paise

    console.log('💰 Creating order:', { totalAmount, amountInPaise });

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    console.log('📞 Calling Razorpay API...');
    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order);

    // Get user info  
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (user) {
      // Save payment order to database for later verification
      await prisma.paymentOrder.create({
        data: {
          user_id: user.id,
          razorpay_order_id: order.id,
          amount: totalAmount,
          credits: amount, // Amount without bonus
          bonus: bonusAmount,
          status: "PENDING"
        }
      }).catch(err => {
        // Log error but don't fail the request
        console.warn("Failed to save payment order to DB:", err.message);
      });
    }

    res.status(200).json({
      order_id: order.id,
      amount: totalAmount,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID,
      bonus: bonusAmount
    });
  } catch (error) {
    console.error("❌ Create Order Error:", error.message);
    console.error("❌ Full error:", error);
    res.status(500).json({ error: "Failed to create payment order: " + error.message });
  }
});

/**
 * GET /payment-page
 * Serve Razorpay Checkout page with proper modal display
 */
app.get("/payment-page", (req, res) => {
  const { order_id, amount, credits } = req.query;
  
  if (!order_id || !amount) {
    return res.status(400).send('Missing order_id or amount');
  }

  const amountInPaise = Math.round(amount * 100);
  const razorpayKey = process.env.RAZORPAY_KEY_ID;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Checkout - ConsultaPro</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
        }
        h1 { color: #1f2937; margin-bottom: 10px; font-size: 24px; }
        .amount { color: #3b82f6; font-size: 32px; font-weight: bold; margin: 20px 0; }
        .description { color: #6b7280; margin-bottom: 20px; }
        .status { color: #16a34a; margin: 20px 0; }
        button {
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover { background: #2563eb; }
        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .cancel-link {
          display: block;
          margin-top: 15px;
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
        }
        .cancel-link:hover { color: #1f2937; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Complete Payment</h1>
        <div class="amount">₹${amount}</div>
        <p class="description">Adding ${credits || 'credits'} to your wallet</p>
        <button id="payBtn">Pay with Razorpay</button>
        <a href="http://localhost:3000" class="cancel-link">Cancel</a>
      </div>

      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script>
        // Function to get user email from localStorage or use default
        function getUserEmail() {
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              return user.email || 'user@consultapro.com';
            }
          } catch (e) {
            console.log('Could not parse user from localStorage');
          }
          return 'user@consultapro.com';
        }

        document.getElementById('payBtn').addEventListener('click', function() {
          const userEmail = getUserEmail();
          
          // Initialize Razorpay directly with checkout.open()
          Razorpay.open({
            key: '${razorpayKey}',
            amount: ${amountInPaise},
            currency: 'INR',
            name: 'ConsultaPro',
            description: 'Add ${credits || 'credits'} credits to your wallet',
            order_id: '${order_id}',
            prefill: {
              email: userEmail,
              contact: '9999999999'
            },
            notes: {
              credits: '${credits}',
              app: 'ConsultaPro'
            },
            theme: {
              color: '#3b82f6'
            },
            method: {
              upi: true,
              netbanking: true,
              card: true,
              wallet: true
            },
            handler: function(response) {
              // Show loading state
              document.getElementById('payBtn').disabled = true;
              document.getElementById('payBtn').innerText = 'Verifying...';
              
              // Verify payment on backend
              fetch('http://localhost:5000/payment/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: ${amount}
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.success || data.new_balance !== undefined) {
                  // Payment successful - show success message and redirect
                  alert('Payment successful! ' + data.amount_added + ' credits have been added to your wallet.');
                  // Redirect back to credits page - preserves auth context
                  window.location.href = 'http://localhost:3000/credits?payment=success&credits=' + encodeURIComponent(data.amount_added);
                } else {
                  alert('Payment verification failed: ' + (data.error || 'Unknown error'));
                  document.getElementById('payBtn').disabled = false;
                  document.getElementById('payBtn').innerText = 'Pay with Razorpay';
                }
              })
              .catch(err => {
                alert('Error: ' + err.message);
                document.getElementById('payBtn').disabled = false;
                document.getElementById('payBtn').innerText = 'Pay with Razorpay';
              });
            },
            modal: {
              ondismiss: function() {
                document.getElementById('payBtn').disabled = false;
                document.getElementById('payBtn').innerText = 'Pay with Razorpay';
              }
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

/**
 * POST /payment/verify
 * Verify Razorpay payment and add credits to wallet
 * Note: Does NOT require Firebase auth - signature verification is sufficient for security
 */
app.post("/payment/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  try {
    if (!razorpay) {
      return res.status(503).json({ error: "Payment service not configured" });
    }

    // Verify payment signature (cryptographically secure)
    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Fetch order from Razorpay to get metadata
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    if (!paymentDetails) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Find the order record in our database to get user info
    const orderRecord = await prisma.paymentOrder.findUnique({
      where: { razorpay_order_id: razorpay_order_id }
    });

    if (!orderRecord) {
      console.warn(`Order not found in DB: ${razorpay_order_id}, but signature is valid`);
      // If order not in DB but signature is valid, still process it
      // This handles edge cases where order was created but DB record is missing
      return res.status(200).json({
        message: "Payment signature verified but order not found in system",
        payment_id: razorpay_payment_id,
        note: "Please contact support if credits are not added"
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: orderRecord.user_id }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found for this order" });
    }

    // Create or get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }

    const creditsToAdd = orderRecord.credits || amount;
    const bonusAmount = orderRecord.bonus || 0;
    const totalCredits = creditsToAdd + bonusAmount;

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + totalCredits
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "CREDIT",
        amount: totalCredits,
        description: `Added ${creditsToAdd} credits${bonusAmount > 0 ? ` with ${bonusAmount} bonus` : ''} via Razorpay (Order: ${razorpay_order_id})`,
        payment_method: "RAZORPAY",
        status: "SUCCESS"
      }
    });

    // Update order status
    await prisma.paymentOrder.update({
      where: { id: orderRecord.id },
      data: {
        status: "COMPLETED",
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature
      }
    });

    // Send invoice email
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .invoice-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-top: 15px; }
          .value { font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 5px; }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          .success { color: #16a34a; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #3b82f6; color: white; padding: 10px; text-align: left; }
          .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Invoice</h1>
            <p>ConsultaPro - Expert Consultations Simplified</p>
          </div>
          
          <div class="content">
            <div class="invoice-box">
              <p>Dear ${user.email},</p>
              <p>Thank you for your payment! Your transaction has been successfully completed.</p>
            </div>

            <div class="invoice-box">
              <div class="label">Invoice Number</div>
              <div class="value">${razorpay_order_id}</div>

              <div class="label">Payment ID</div>
              <div class="value">${razorpay_payment_id}</div>

              <div class="label">Date</div>
              <div class="value">${new Date().toLocaleDateString('en-IN')}</div>

              <div class="divider"></div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${creditsToAdd} Credits</td>
                    <td style="text-align: right;">₹${orderRecord.amount}</td>
                  </tr>
                  ${bonusAmount > 0 ? `<tr>
                    <td>${bonusAmount} Bonus Credits</td>
                    <td style="text-align: right; color: #16a34a;">FREE</td>
                  </tr>` : ''}
                </tbody>
              </table>

              <div class="divider"></div>

              <div class="label">Total Amount Paid</div>
              <div class="value">₹${orderRecord.amount}</div>

              <div class="label">Total Credits Received</div>
              <div class="value" style="color: #16a34a; font-size: 18px;">${totalCredits} Credits</div>

              <div class="label">Current Wallet Balance</div>
              <div class="value">${updatedWallet.balance} Credits</div>
            </div>

            <div class="invoice-box" style="border-left-color: #16a34a;">
              <p class="success">✓ Payment Status: SUCCESS</p>
              <p>Your credits have been automatically added to your wallet and are ready to use.</p>
            </div>

            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>© 2026 ConsultaPro. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email asynchronously (don't wait for it)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Payment Invoice - ConsultaPro Credits Purchase",
      html: invoiceHtml
    }).catch(err => {
      console.error(`Failed to send invoice email to ${user.email}:`, err.message);
    });

    console.log(`✓ Payment verified and ${totalCredits} credits added to user ${user.email}`);
    console.log(`📧 Invoice email sent to ${user.email}`);
    res.status(200).json({
      message: "Payment successful and credits added",
      amount_added: totalCredits,
      bonus: bonusAmount,
      new_balance: updatedWallet.balance,
      payment_id: razorpay_payment_id,
      success: true
    });
  } catch (error) {
    console.error("Payment Verification Error:", error.message);
    res.status(500).json({ error: "Failed to verify payment: " + error.message });
  }
});

/**
 * POST /wallet/add-credits
 * Add credits to user wallet (simulate payment)
 */
app.post("/wallet/add-credits", verifyFirebaseToken, async (req, res) => {
  const { amount, package_id } = req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create or get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }

    // Calculate bonus if package is specified
    let bonusAmount = 0;
    if (package_id) {
      const creditPackage = await prisma.creditPackage.findUnique({
        where: { id: parseInt(package_id) }
      });
      if (creditPackage) {
        bonusAmount = creditPackage.bonus || 0;
      }
    }

    const totalCredits = amount + bonusAmount;

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + totalCredits
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "CREDIT",
        amount: totalCredits,
        description: `Added ₹${amount} credits${bonusAmount > 0 ? ` with ₹${bonusAmount} bonus` : ''}`,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS"
      }
    });

    console.log(`✓ Added ₹${totalCredits} credits to user ${user.email}`);
    res.status(200).json({
      message: "Credits added successfully",
      amount_added: totalCredits,
      bonus: bonusAmount,
      new_balance: updatedWallet.balance
    });
  } catch (error) {
    console.error("Add Credits Error:", error.message);
    res.status(500).json({ error: "Failed to add credits: " + error.message });
  }
});

/**
 * GET /transactions
 * Get user's transaction history
 */
app.get("/transactions", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { created_at: 'desc' },
      take: 50 // Limit to last 50 transactions
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Get Transactions Error:", error.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/**
 * POST /bookings/create
 * Create a booking request
 */
app.post("/bookings/create", verifyFirebaseToken, async (req, res) => {
  const { consultant_id, date, time_slot } = req.body;

  try {
    if (!consultant_id || !date || !time_slot) {
      return res
        .status(400)
        .json({ error: "consultant_id, date, and time_slot are required" });
    }

    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get consultant details to check fee
    const consultant = await prisma.consultant.findUnique({
      where: { id: parseInt(consultant_id) }
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    if (!consultant.hourly_price) {
      return res.status(400).json({ error: "Consultant fee not set" });
    }

    // Create or get wallet if it doesn't exist
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }

    // Check if user has sufficient balance
    if (wallet.balance < consultant.hourly_price) {
      return res.status(400).json({ 
        error: "Insufficient balance",
        required: consultant.hourly_price,
        current: wallet.balance
      });
    }

    // Deduct amount from wallet
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance - consultant.hourly_price
      }
    });

    // Create booking with payment details
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        consultantId: parseInt(consultant_id),
        date: new Date(date),
        time_slot: time_slot || "10:00 AM",
        status: "CONFIRMED",
        is_paid: true,
        consultant_fee: consultant.hourly_price,
        commission_fee: consultant.hourly_price * 0.10, // 10% commission
        net_earning: consultant.hourly_price * 0.90 // 90% to consultant
      },
    });

    // Create transaction record for wallet deduction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEBIT",
        amount: consultant.hourly_price,
        description: `Payment for consultation with ${consultant.domain} consultant`,
        bookingId: booking.id,
        consultantId: consultant.id,
        payment_method: "WALLET",
        status: "SUCCESS"
      }
    });

    console.log(
      `✓ Booking created: User ${user.email} → Consultant ${consultant_id}, Fee: ₹${consultant.hourly_price}`
    );
    res.status(201).json({
      ...booking,
      message: "Booking confirmed and payment processed",
      remaining_balance: updatedWallet.balance
    });
  } catch (error) {
    console.error("Create Booking Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to create booking: " + error.message });
  }
});

/**
 * POST /bookings/:id/complete
 * Mark a call as completed and process commission distribution
 */
app.post("/bookings/:id/complete", verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const { call_duration } = req.body; // Duration in minutes

  try {
    const bookingId = parseInt(id);
    
    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        consultant: {
          include: { user: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.call_completed) {
      return res.status(400).json({ error: "Call already completed" });
    }

    // Verify that the requester is either the user or consultant involved
    const requester = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid }
    });

    if (!requester || (requester.id !== booking.userId && requester.id !== booking.consultant.userId)) {
      return res.status(403).json({ error: "Unauthorized to complete this booking" });
    }

    // Update booking as completed
    const completedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        call_completed: true,
        call_duration: call_duration || 60, // Default 60 minutes if not provided
        completed_at: new Date(),
        status: "COMPLETED"
      }
    });

    // Create commission transaction for platform
    await prisma.transaction.create({
      data: {
        userId: booking.consultant.userId,
        type: "COMMISSION",
        amount: booking.commission_fee,
        description: `Platform commission from consultation (Booking #${bookingId})`,
        bookingId: bookingId,
        consultantId: booking.consultantId,
        payment_method: "COMMISSION",
        status: "SUCCESS"
      }
    });

    // Create earning transaction for consultant
    await prisma.transaction.create({
      data: {
        userId: booking.consultant.userId,
        type: "EARNING",
        amount: booking.net_earning,
        description: `Earnings from consultation (Booking #${bookingId})`,
        bookingId: bookingId,
        consultantId: booking.consultantId,
        payment_method: "WALLET",
        status: "SUCCESS"
      }
    });

    console.log(
      `✓ Call completed: Booking #${bookingId}, Platform earned ₹${booking.commission_fee}, Consultant earned ₹${booking.net_earning}`
    );

    res.status(200).json({
      message: "Call completed successfully",
      booking: completedBooking,
      commission_fee: booking.commission_fee,
      consultant_earning: booking.net_earning
    });
  } catch (error) {
    console.error("Complete Booking Error:", error.message);
    res.status(500).json({ error: "Failed to complete booking: " + error.message });
  }
});

/**
 * GET /bookings
 * Get user's bookings
 */
app.get("/bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        consultant: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Bookings Error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

const PORT = process.env.PORT || 5000;
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join-booking", (bookingId) => {
    socket.join(`booking_${bookingId}`);
    console.log("User joined booking room:", bookingId);
  });

  socket.on("send-message", async (data) => {
    console.log("📩 Message received:", data);

    try {
      const { bookingId, senderId, role, content } = data;

      const bookingIdInt = parseInt(bookingId);

      const booking = await prisma.booking.findUnique({
        where: { id: bookingIdInt },
      });

      if (!booking) {
        socket.emit("ERROR", { message: "Booking not found" });
        return;
      }

      const clientMessageCount = await prisma.message.count({
        where: {
          bookingId: bookingIdInt,
          senderId: booking.userId, // Only count client's messages
        },
      });
      if (role === "client" && !booking.is_paid && clientMessageCount >= 5) {
        socket.emit("PAYMENT_REQUIRED", {
          message: "Free chat limit reached. Please complete payment.",
        });
        return;
      }
      const message = await prisma.message.create({
        data: {
          bookingId: bookingIdInt,
          senderId: parseInt(senderId),
          content,
        },
      });

      io.to(`booking_${bookingId}`).emit("receive-message", {
        ...message,
        role,
      });
    } catch (error) {
      console.error("Message Error:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});