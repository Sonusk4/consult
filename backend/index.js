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
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
/**
 * Nodemailer configuration for Email OTP
 * Using Gmail or your preferred email service
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

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
  const { role, phone } = req.body || {};

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
      user = await prisma.user.update({
        where: { email: req.user.email },
        data: {
          firebase_uid: req.user.firebase_uid,
          phone: phone || undefined
        },
      });
    } else {
      // If they don't exist at all, create them
      user = await prisma.user.create({
        data: {
          firebase_uid: req.user.firebase_uid,
          email: req.user.email,
          phone: phone || null,
          role: role || "USER",
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
      console.log(
        `📧 Attempting to send OTP to ${email} using ${process.env.EMAIL_USER}`
      );
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "🔐 Your Email Verification OTP - Consultation Platform",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
            <p style="color: #999;">This OTP will expire in 10 minutes.</p>
            <p style="color: #999;">Do not share this code with anyone.</p>
          </div>
        `,
      });
      console.log(`✓ OTP email sent to ${email}. OTP: ${otp}`);
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
  const { type, domain, bio, languages, hourly_price } = req.body;

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
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        consultantId: parseInt(consultant_id),
        date: new Date(date),
        time_slot: time_slot || "10:00 AM",
        status: "PENDING",
      },
    });

    console.log(
      `✓ Booking created: User ${user.email} → Consultant ${consultant_id}`
    );
    res.status(201).json(booking);
  } catch (error) {
    console.error("Create Booking Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to create booking: " + error.message });
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
