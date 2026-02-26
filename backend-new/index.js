const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { Resend } = require("resend");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const verifyFirebaseToken = require("./middleware/authMiddleware");
const Razorpay = require("razorpay");
const generateAgoraToken = require("./agora");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const { generateInvoicePDF } = require("./invoice-generator");
const app = express();
// Initialize Firebase Admin SDK
let firebaseAdminInitialized = false;
try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    firebaseAdminInitialized = true;
    console.log("✅ Firebase Admin initialized successfully");
  } else {
    console.log("⚠️ Firebase Admin credentials missing");
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
  },
});
/**
 * Razorpay Configuration
 */
console.log("🔍 Checking Razorpay environment variables:");
console.log(
  "RAZORPAY_KEY_ID:",
  process.env.RAZORPAY_KEY_ID ? "SET" : "NOT SET"
);
console.log(
  "RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? "SET" : "NOT SET"
);

let razorpay;
if (
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_ID !== "rzp_test_XXXXXXXXXXXXXXXXXXXXXXX"
) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay initialized successfully");
} else {
  console.log("⚠️ Razorpay credentials not configured. Using test mode.");
}

/**
 * Agora Video Call Configuration
 */
console.log("🔍 Checking Agora environment variables:");
console.log("AGORA_APP_ID:", process.env.AGORA_APP_ID ? "SET" : "NOT SET");
console.log(
  "AGORA_APP_CERTIFICATE:",
  process.env.AGORA_APP_CERTIFICATE ? "SET" : "NOT SET"
);

if (process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE) {
  console.log("✅ Agora Video Call initialized successfully");
} else {
  console.log(
    "⚠️ Agora credentials not configured. Video calls will not work."
  );
}

/**
 * Nodemailer configuration for Email OTP (Gmail)
 */
console.log("🔍 Checking email environment variables:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "NOT SET");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");

let transporter;
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log("✅ Gmail Nodemailer initialized successfully");

  // Test the transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email service connection failed:", error.message);
    } else if (success) {
      console.log("✅ Email service ready to send messages");
    }
  });
} else {
  console.log(
    "⚠️ Email credentials not configured. OTP will be printed to console for testing."
  );
}

console.log("📧 Email configured:", isEmailConfigured);

// DEV AUTH MIDDLEWARE (FOR SOCKET + BOOKINGS)
// DEV AUTH MIDDLEWARE (FOR LOGIN + BOOKINGS + SOCKET)

//const agoraRoute = require("./routes/agoraToken");
//app.use("/agora", agoraRoute);
/* ================= DEV AUTH MIDDLEWARE ================= */

/**
 * GET /auth/debug
 * Debug endpoint to check authentication status
 */
app.get("/auth/debug", verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firebase_uid: req.user.firebase_uid,
        role: req.user.role,
        is_verified: req.user.is_verified,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/auth/me", async (req, res) => {
  try {
    const { role, name, phone, bio, location } = req.body;
    let userEmail = req.body.email;
    let user;

    // Try to get user from auth token first
    if (req.user?.email) {
      userEmail = req.user.email;
    }

    if (!userEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log(`📝 Syncing user: ${userEmail}, role: ${role || "N/A"}`);

    // Find or create user
    user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { profile: true },
    });

    if (user) {
      // Update existing user
      console.log(`✏️ Updating existing user: ${userEmail}`);
      user = await prisma.user.update({
        where: { email: userEmail },
        data: {
          role: role || user.role,
          name: name || user.name,
          phone: phone !== undefined ? phone : user.phone,
          is_verified: true,
        },
        include: { profile: true },
      });
    } else {
      // Create new user
      console.log(`✨ Creating new user: ${userEmail}`);
      user = await prisma.user.create({
        data: {
          email: userEmail,
          role: role || "USER",
          name: name || null,
          phone: phone || null,
          is_verified: true,
        },
        include: { profile: true },
      });
    }

    // Update or create profile if bio or location provided
    if (bio !== undefined || location !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          bio: bio !== undefined ? bio : undefined,
          location: location !== undefined ? location : undefined,
        },
        create: {
          userId: user.id,
          bio: bio || null,
          location: location || null,
        },
      });

      // Fetch updated user with profile
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
    }

    console.log(`✅ User synced: ${user.email} with role ${user.role}`);

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified,
      profile: user.profile,
    });
  } catch (error) {
    console.error("❌ Sync user error:", error.message);
    res.status(500).json({ error: "Failed to sync user: " + error.message });
  }
});

/* ================= PROTECTED ENDPOINTS ================= */

/**
      where: { firebase_uid },
      include: {
        consultant: true,
        profile: true,
        wallet: true,
      },
    });
    const userEmail = req.user.email;

    if (!user) {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Link existing user to Firebase
        console.log(`🔄 Linking existing user ${email} to Firebase UID`);
        user = await prisma.user.update({
          where: { email },
          data: {
            firebase_uid,
            name: name || existingUser.name,
            role: role || existingUser.role,
            is_verified: true,
          },
          include: {
            consultant: true,
            profile: true,
            wallet: true,
          },
        });
      } else {
        // Create new user
        console.log(`🆕 Creating new user ${email}`);
        user = await prisma.user.create({
          data: {
            firebase_uid,
            email,
            name: name || email.split("@")[0],
            role: role || "USER",
            is_verified: true,
          },
          include: {
            consultant: true,
            profile: true,
            wallet: true,
          },
        });
      }
    } else {
      // Update existing user if name or role provided
      if (name || role) {
        console.log(`🔄 Updating existing user ${email}`);
        user = await prisma.user.update({
          where: { firebase_uid },
          data: {
            name: name || user.name,
            role: role || user.role,
          },
          include: {
            consultant: true,
            profile: true,
            wallet: true,
          },
        });
      }
    }

    // Ensure wallet exists
    if (!user.wallet) {
      user.wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });
    }

    console.log(
      `✅ User synced successfully: ${user.email} (Role: ${user.role})`
    );
    return res.json(user);
  } catch (error) {
    console.error("❌ Auth/me Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to sync user: " + error.message });
  }
});
console.log("🔍 Checking environment variables:");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "SET" : "NOT SET");
console.log("EMAIL_FROM:", process.env.EMAIL_FROM ? "SET" : "NOT SET");

let resend;
if (
  process.env.RESEND_API_KEY &&
  process.env.RESEND_API_KEY !== "your_resend_api_key"
) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("✅ Resend initialized successfully");
} else {
  console.log("⚠️ Resend API key not configured. Using test mode.");
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to ensure Cloudinary is configured (hoisted function)
function ensureCloudinaryConfigured() {
  const current = cloudinary.config();
  if (!current.api_key || !current.api_secret || !current.cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return cloudinary.config();
}

if (process.env.CLOUDINARY_API_KEY) {
  console.log("✅ Cloudinary configured:", process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log("⚠️ Cloudinary API key not configured!");
}

/**
 * Multer configuration for handling file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * Prisma 7 Initialization with PostgreSQL Adapter
 * The adapter handles the database connection through pg (node-postgres)
 */
const prisma = new PrismaClient({
  errorFormat: "pretty",
});
const onlineConsultants = new Map();

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// DEV AUTH MIDDLEWARE (FOR LOGIN + BOOKINGS + SOCKET)

app.get("/", (req, res) => {
  res.send("Backend + Socket + Neon is running 🚀");
});

/**
 * Firebase is disabled for now - private key appears corrupted
 * TODO: Update FIREBASE_PRIVATE_KEY in .env with valid credentials
 * and remove the is_firebase_enabled check
 */

/**
 * Workflow:
 * 1. Verify Firebase token [cite: 9]
 * 2. Check if user exists in PostgreSQL [cite: 9]
 * 3. If not, create new record with the chosen role [cite: 10]
 */

/**
 * Helper function to generate random username
 */
function generateUsername() {
  const adjectives = ["Swift", "Smart", "Bright", "Clever", "Expert"];
  const nouns = ["Consultant", "Mentor", "Advisor", "Coach", "Guide"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 10000);
  return `${adjective}${noun}${randomNum}`.toLowerCase();
}

/**
 * Helper function to generate random password
 */
function generatePassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Helper function to generate invite token
 */
function generateInviteToken() {
  return require("crypto").randomBytes(32).toString("hex");
}

//inviting enterprise members

app.post("/enterprise/invite", verifyFirebaseToken, async (req, res) => {
  try {
    const { email, name, domain } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Try to find admin by firebase_uid first, then by email
    let admin = await prisma.user
      .findUnique({
        where: { firebase_uid: req.user.firebase_uid },
        include: { enterprise: true, ownedEnterprise: true },
      })
      .catch(() => null);

    // If not found and in dev mode (Firebase disabled), find by email or create
    if (!admin) {
      admin = await prisma.user
        .findUnique({
          where: { email: req.user.email },
          include: { enterprise: true, ownedEnterprise: true },
        })
        .catch(() => null);

      // If still not found and Firebase is disabled (dev mode), create a test admin
    }

    if (!admin) {
      return res
        .status(404)
        .json({ error: "Admin not found. Please login first." });
    }

    const adminEnterpriseId = admin.enterpriseId || admin.ownedEnterprise?.id || null;

    // Generate credentials
    const username = generateUsername();
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const inviteToken = generateInviteToken();
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check if user already exists
    const existingUser = await prisma.user
      .findUnique({
        where: { email },
      })
      .catch(() => null);

    let newMember;
    if (existingUser) {
      // Update existing user to ENTERPRISE_MEMBER role
      newMember = await prisma.user.update({
        where: { email },
        data: {
          firebase_uid: `invite-${inviteToken}`,
          name: name || existingUser.name,
          role: "ENTERPRISE_MEMBER",
          ...(existingUser.enterpriseId || adminEnterpriseId
            ? { enterpriseId: existingUser.enterpriseId || adminEnterpriseId }
            : {}),
          invite_token: inviteToken,
          invite_token_expiry: inviteTokenExpiry,
          temp_username: username,
          temp_password: password,
        },
      });
    } else {
      // Create new user with ENTERPRISE_MEMBER role
      newMember = await prisma.user.create({
        data: {
          firebase_uid: `invite-${inviteToken}`,
          email,
          name: name || null,
          role: "ENTERPRISE_MEMBER",
          is_verified: false,
          ...(adminEnterpriseId ? { enterpriseId: adminEnterpriseId } : {}),
          invite_token: inviteToken,
          invite_token_expiry: inviteTokenExpiry,
          temp_username: username,
          temp_password: password,
        },
      });
    }

    // Create invite link
    const inviteLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/#/enterprise/invite/${inviteToken}`;

    // Send invite email with credentials
    try {
      const inviteHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
            .credentials-box { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; font-family: 'Courier New', monospace; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #1f2937; font-size: 14px; }
            .value { background: white; padding: 10px; border-radius: 4px; margin-top: 5px; word-break: break-all; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ConsultaPro Team! 🎉</h1>
              <p>You have been invited to join an enterprise team</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <p>Hi ${name || "there"},</p>
                <p>You have been invited to join an enterprise team on ConsultaPro. Click the button below to accept the invitation and create your account.</p>
              </div>

              <div class="button-container">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Your Temporary Credentials</h3>
                <p>You can use these credentials to log in after accepting the invitation:</p>
              </div>

              <div class="credentials-box">
                <div class="field">
                  <div class="label">Username:</div>
                  <div class="value">${username}</div>
                </div>
                <div class="field">
                  <div class="label">Temporary Password:</div>
                  <div class="value">${password}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${email}</div>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> Please keep these credentials safe. We recommend changing your password after your first login for security purposes.
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">How to get started:</h3>
                <ol>
                  <li>Click the "Accept Invitation" button above</li>
                  <li>Use the credentials provided to log in</li>
                  <li>Complete your profile</li>
                  <li>Start accepting consultations!</li>
                </ol>
              </div>

              <p style="color: #6b7280; font-size: 14px;">This invitation link will expire in 7 days. If you need a new link, please contact your enterprise administrator.</p>
            </div>

            <div class="footer">
              <p>© 2026 ConsultaPro. All rights reserved.</p>
              <p>This is an automated message from ConsultaPro Platform.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      if (isEmailConfigured && transporter) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "🎉 Welcome to ConsultaPro - Enterprise Team Invitation",
          html: inviteHtml,
        });
        console.log(`✓ Invite email sent to ${email}`);
      } else {
        console.log(`📧 Email not configured. Invite details for testing:`);
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log(`   Invite Link: ${inviteLink}`);
      }
    } catch (emailError) {
      console.error(`❌ Failed to send invite email:`, emailError.message);
    }

    res.status(201).json({
      message: "Invitation sent successfully",
      invite_token: inviteToken,
      member: {
        id: newMember.id,
        email: newMember.email,
        name: newMember.name,
        username: username,
        password: password,
        role: "ENTERPRISE_MEMBER",
        status: "PENDING_ACCEPTANCE",
        invite_expires_at: inviteTokenExpiry,
      },
    });

    console.log(`✅ Member invited successfully:`);
    console.log(`   Email: ${newMember.email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error("Invite error:", error);
    res
      .status(500)
      .json({ error: "Failed to create invite: " + error.message });
  }
});

/**
 * GET /enterprise/invite/:token
 * Verify invitation token
 */
app.get("/enterprise/invite/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const invitedUser = await prisma.user.findUnique({
      where: { invite_token: token },
    });

    if (!invitedUser) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    // Check if token has expired
    if (invitedUser.invite_token_expiry < new Date()) {
      return res.status(400).json({ error: "Invitation has expired" });
    }

    res.status(200).json({
      valid: true,
      email: invitedUser.email,
      name: invitedUser.name,
      username: invitedUser.temp_username,
      temp_password: invitedUser.temp_password,
    });
  } catch (error) {
    console.error("Verify invite error:", error);
    res.status(500).json({ error: "Failed to verify invitation" });
  }
});

/**
 * POST /enterprise/accept-invite
 * Accept invitation and create consultant profile with auto-generated password
 */
app.post("/enterprise/accept-invite", async (req, res) => {
  try {
    const { token, firebase_uid, phone, name, password } = req.body;

    if (!token || !firebase_uid) {
      return res
        .status(400)
        .json({ error: "Token and firebase_uid are required" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const invitedUser = await prisma.user.findUnique({
      where: { invite_token: token },
    });

    if (!invitedUser) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    // Check if token has expired
    if (invitedUser.invite_token_expiry < new Date()) {
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Get enterprise from invite record
    const inviteRecord = await prisma.enterpriseInvite
      .findUnique({ where: { token } })
      .catch(() => null);
    const enterpriseIdFromInvite = inviteRecord?.enterpriseId || invitedUser.enterpriseId;

    // Hash the user-provided password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user - becomes consultant connected to enterprise
    const updatedUser = await prisma.user.update({
      where: { id: invitedUser.id },
      data: {
        firebase_uid: firebase_uid,
        name: name || invitedUser.name,
        phone: phone || invitedUser.phone,
        is_verified: true,
        role: "CONSULTANT", // Consultant role (with individual type consultant profile)
        permanent_password: hashedPassword,
        password_changed: true, // Password already set by user
        enterpriseId: enterpriseIdFromInvite || invitedUser.enterpriseId,
        invite_token: null,
        invite_token_expiry: null,
      },
    });

    // Create consultant profile
    await prisma.consultant.upsert({
      where: { userId: updatedUser.id },
      update: {},
      create: {
        userId: updatedUser.id,
        type: "individual",
        is_verified: false,
      },
    });

    // Create user profile if not exists
    await prisma.userProfile.upsert({
      where: { userId: updatedUser.id },
      update: {},
      create: {
        userId: updatedUser.id,
      },
    });

    console.log(`✓ Invitation accepted by ${updatedUser.email}`);
    console.log(`✓ Consultant profile created for ${updatedUser.email}`);
    console.log(`✓ Password set by user`);

    res.status(200).json({
      message: "Invitation accepted successfully. You can now login with your email and password.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    res
      .status(500)
      .json({ error: "Failed to accept invitation: " + error.message });
  }
});

/**
 * POST /auth/check-username
 * Check if a username is available
 */
app.post("/auth/check-username", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username exists in permanent_username or temp_username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { permanent_username: username },
          { temp_username: username },
        ],
      },
    });

    res.json({ 
      available: !existingUser,
      message: existingUser ? "Username is already taken" : "Username is available"
    });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ error: "Failed to check username availability" });
  }
});

/**
 * POST /auth/set-permanent-credentials
 * Set permanent username and password after accepting invitation
 */
app.post("/auth/set-permanent-credentials", async (req, res) => {
  try {
    const { email, permanent_username, permanent_password } = req.body;

    if (!email || !permanent_username || !permanent_password) {
      return res.status(400).json({ 
        error: "Email, username, and password are required" 
      });
    }

    // Validate password strength
    if (permanent_password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long" 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "ENTERPRISE_MEMBER") {
      return res.status(400).json({ error: "Only enterprise members can set credentials" });
    }

    if (!user.is_verified) {
      return res.status(400).json({ error: "Please accept invitation first" });
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        permanent_username: permanent_username,
        NOT: { id: user.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: "Username already taken. Please choose another one." 
      });
    }

    // Hash the permanent password
    const hashedPassword = await bcrypt.hash(permanent_password, 10);

    // Update user with permanent credentials
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        permanent_username: permanent_username,
        permanent_password: hashedPassword,
        password_changed: true,
        // Keep temp credentials for reference but they won't be used for login anymore
      },
    });

    console.log(`✅ Permanent credentials set for: ${updatedUser.email}`);
    console.log(`   New username: ${permanent_username}`);

    res.status(200).json({
      message: "Permanent credentials set successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.permanent_username,
        password_changed: updatedUser.password_changed,
      },
    });
  } catch (error) {
    console.error("Set credentials error:", error);
    res.status(500).json({ 
      error: "Failed to set credentials: " + error.message 
    });
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
  const { email, type } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if user is an enterprise team member - prevent them from using OTP signup
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.role === "ENTERPRISE_MEMBER") {
      // Team members can only login with username/password
      return res.status(403).json({ 
        error: "Enterprise team members must login with their provided credentials",
        hint: "Use the Team Member login option with your username and password"
      });
    }

    // Prevent team members from signing up fresh with ENTERPRISE_MEMBER role
    if (type === "SIGNUP" && req.body.role === "ENTERPRISE_MEMBER") {
      return res.status(403).json({ 
        error: "Enterprise team members cannot sign up independently",
        hint: "Please request an invitation from your enterprise administrator"
      });
    }

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
    let emailSent = false;
    let emailError = null;

    if (!isEmailConfigured) {
      console.log("📧 Email not configured. OTP for testing:", otp);
      console.log(`📝 For testing, use OTP: ${otp} for email: ${email}`);
      // Return success for testing
      emailSent = true;
    } else {
      try {
        console.log(`📧 Sending OTP to ${email} using Gmail SMTP`);
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
        console.log(`✅ OTP email sent successfully to ${email}`);
        emailSent = true;
      } catch (err) {
        emailError = err;
        console.error(`❌ Email send failed:`, err.message);
        console.error(`📧 Full error details:`, {
          code: err.code,
          command: err.command,
          message: err.message,
        });
        console.error(
          `🔧 Configuration check: EMAIL_USER="${
            process.env.EMAIL_USER
          }", EMAIL_PASS set: ${!!process.env.EMAIL_PASS}`
        );
        console.log(`📝 OTP saved to database for testing: ${otp}`);

        // Return error to frontend
        return res.status(500).json({
          error: "Failed to send OTP email",
          details: err.message,
          fallback: `OTP for testing: ${otp}`,
          hint: "Check your email credentials in .env file",
        });
      }
    }

    res.status(200).json({
      message: "OTP sent successfully",
      email: email,
      otp_placeholder: "Check your email for the OTP",
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
/**
 * POST /auth/verify-otp
 * Verify OTP code entered by user
 */
/**
 * POST /auth/verify-otp
 * Verify OTP code entered by user
 */
app.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Trim both OTPs and convert to string for comparison
  const storedOtp = String(user.otp_code || "").trim();
  const providedOtp = String(otp || "").trim();

  console.log(`🔍 OTP Verification Debug:
    Email: ${email}
    Stored OTP: "${storedOtp}" (length: ${storedOtp.length})
    Provided OTP: "${providedOtp}" (length: ${providedOtp.length})
    Match: ${storedOtp === providedOtp}`);

  if (storedOtp !== providedOtp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  if (new Date() > user.otp_expiry) {
    return res.status(400).json({ error: "OTP expired" });
  }
  try {
    // Mark user verified in DB
    const user = await prisma.user.update({
      where: { email },
      data: {
        is_verified: true,
        otp_code: null,
        otp_expiry: null,
      },
    });

    console.log("OTP VERIFIED FOR:", email);

    // CHECK IF FIREBASE IS INITIALIZED
    if (!firebaseAdminInitialized) {
      console.warn("⚠️ Firebase not initialized - generating dev mode token");

      // Generate a proper JWT token for development
      const devToken = jwt.sign(
        {
          email,
          uid: user.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
        process.env.JWT_SECRET || "dev-secret-key-for-testing-only",
        { algorithm: "HS256" }
      );

      return res.status(200).json({
        message: "OTP verified (DEV MODE - No Firebase)",
        customToken: devToken,
        devMode: true,
      });
    }

    // 🔥 Create or get Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
    } catch {
      firebaseUser = await admin.auth().createUser({ email });
    }

    // 🔥 Generate custom token
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    // 🔥 RETURN TOKEN
    return res.status(200).json({
      message: "OTP verified",
      customToken,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to verify OTP: " + error.message });
  }
});
app.get("/auth/debug-otp/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        is_verified: true,
        otp_code: true,
        otp_expiry: true,
      },
    });
    res.json(user || { error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/auth/test-firebase", async (req, res) => {
  try {
    if (!firebaseAdminInitialized) {
      return res.status(500).json({
        error: "Firebase not initialized",
        env: {
          projectId: !!process.env.FIREBASE_PROJECT_ID,
          clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        },
      });
    }

    // Try to list users (just one) to test
    const listUsersResult = await admin.auth().listUsers(1);
    res.json({
      success: true,
      message: "Firebase is working",
      userCount: listUsersResult.users.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Firebase test failed",
      details: error.message,
    });
  }
});

/**
 * DEPRECATED - Replaced with unified email + password login
 * This endpoint is no longer used
 */
// app.post("/auth/login-member", ...)

/**
 * GET /auth/member-debug/:email
 * Debug endpoint - Check if a member exists and their verification status
 */
app.get("/auth/member-debug/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        temp_username: true,
        is_verified: true,
        invite_token_expiry: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "ENTERPRISE_MEMBER") {
      return res.status(400).json({ error: "User is not an enterprise member" });
    }

    res.json({
      found: true,
      email: user.email,
      name: user.name,
      username: user.temp_username,
      isVerified: user.is_verified,
      inviteExpiry: user.invite_token_expiry,
      status: !user.is_verified ? "NOT_VERIFIED - Member needs to accept invitation" : "READY_TO_LOGIN",
      instructions: user.is_verified 
        ? `Use username: ${user.temp_username} to login`
        : "Member must accept the invitation first before login",
    });
  } catch (error) {
    console.error("Debug check error:", error);
    res.status(500).json({ error: "Debug check failed: " + error.message });
  }
});

/**
 * POST /auth/signup
 * Register a new user with email, password, name, and phone
 * Requires OTP verification after signup
 */
app.post("/auth/signup", async (req, res) => {
  const { email, password, fullName, phone, role } = req.body;

  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({
      error: "Email, password, full name, and phone are required",
    });
  }

  try {
    console.log(`📝 Signup attempt: ${email}`);

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user with OTP (not verified yet)
    const newUser = await prisma.user.create({
      data: {
        email,
        name: fullName,
        phone,
        role: role || "USER",
        firebase_uid: uuidv4(), // Generate unique firebase_uid
        permanent_password: hashedPassword,
        password_changed: true,
        is_verified: false, // User must verify with OTP
        otp_code: otp,
        otp_expiry: otpExpiry,
      },
    });

    console.log(`✅ User created: ${email}, OTP sent: ${otp}`);

    // Send OTP via email
    try {
      if (transporter) {
        await transporter.sendMail({
          to: email,
          subject: "ConsultaPro - Verify Your Email",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to ConsultaPro!</h2>
              <p>Hi ${fullName},</p>
              <p>Thank you for signing up. Please verify your email with the following code:</p>
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="letter-spacing: 5px; color: #0066cc; margin: 0;">${otp}</h1>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't create this account, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ConsultaPro Team</p>
            </div>
          `
        });
        console.log(`📧 OTP email sent to: ${email}`);
      }
    } catch (emailErr) {
      console.error("⚠️ Failed to send OTP email:", emailErr.message);
      // Continue anyway - user can request new OTP if needed
    }

    // Create or update user profile
    await prisma.userProfile.upsert({
      where: { userId: newUser.id },
      update: {},
      create: {
        userId: newUser.id,
      },
    });

    res.status(201).json({
      message: "User registered successfully. Please verify your email with the OTP sent to your inbox.",
      email: newUser.email,
      requiresOtp: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
      },
      instructions: "Check your email for the verification code. You will receive a 6-digit OTP.",
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Signup failed: " + error.message });
  }
});

/**
 * POST /auth/login-password
 * Login with email and password
 */
app.post("/auth/login-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }

  try {
    console.log(`🔐 Password login attempt: ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    // Verify password (check permanent_password)
    let passwordValid = false;
    if (user.permanent_password) {
      passwordValid = await bcrypt.compare(password, user.permanent_password);
    }

    if (!passwordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    console.log(`✅ Password verified for ${email}`);

    // Check if first login - needs password change
    if (!user.password_changed) {
      console.log(`⚠️ First login detected for ${email} - password change required`);
      
      // Generate temporary token for password change (30 min expiry)
      let tempToken;
      if (!firebaseAdminInitialized) {
        tempToken = jwt.sign(
          {
            email: user.email,
            uid: user.id,
            temp: true,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
          },
          process.env.JWT_SECRET || "dev-secret-key-for-testing-only",
          { algorithm: "HS256" }
        );
      } else {
        tempToken = await admin.auth().createCustomToken(user.firebase_uid);
      }
      
      return res.status(200).json({
        message: "First login detected - please change your password",
        requiresPasswordChange: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Generate token
    let token;
    if (!firebaseAdminInitialized) {
      console.log("Dev mode - generating JWT token");
      token = jwt.sign(
        {
          email: user.email,
          uid: user.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
        },
        process.env.JWT_SECRET || "dev-secret-key-for-testing-only",
        { algorithm: "HS256" }
      );
    } else {
      // Create Firebase custom token
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
      } catch {
        firebaseUser = await admin.auth().createUser({ email });
      }
      token = await admin.auth().createCustomToken(firebaseUser.uid);
    }

    res.status(200).json({
      message: "Login successful",
      customToken: token,
      devMode: !firebaseAdminInitialized,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Password login error:", error.message);
    res
      .status(500)
      .json({ error: "Login failed: " + error.message });
  }
});

/**
 * POST /auth/change-password-first-login
 * Change password on first login (after accepting invitation)
 */
app.post("/auth/change-password-first-login", verifyFirebaseToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    // Get user from token
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { consultant: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark as changed
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        permanent_password: hashedPassword,
        password_changed: true,
      },
      include: { consultant: true }
    });

    // Generate permanent token
    let token;
    if (!firebaseAdminInitialized) {
      token = jwt.sign(
        {
          email: updatedUser.email,
          uid: updatedUser.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
        },
        process.env.JWT_SECRET || "dev-secret-key-for-testing-only",
        { algorithm: "HS256" }
      );
    } else {
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(updatedUser.email);
      } catch {
        firebaseUser = await admin.auth().createUser({ email: updatedUser.email });
      }
      token = await admin.auth().createCustomToken(firebaseUser.uid);
    }

    console.log(`✅ Password changed successfully for ${updatedUser.email}`);

    res.status(200).json({
      message: "Password changed successfully",
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isConsultant: !!updatedUser.consultant,
      },
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ error: "Failed to change password: " + error.message });
  }
});
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    console.log(`📧 Forgot password request: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists for security
      console.log(`ℹ️ User not found: ${email}`);
      return res.status(200).json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = require("crypto").randomBytes(32).toString("hex");
    const resetTokenHash = require("crypto")
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save reset token (valid for 1 hour)
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: {
        password_reset_token: resetTokenHash,
        password_reset_expiry: expiryTime,
      },
    });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/#/reset-password?token=${resetToken}&email=${email}`;

    console.log(`✅ Reset token generated for: ${email}`);
    console.log(`📌 Reset link: ${resetLink}`);

    // Send reset email
    try {
      if (transporter) {
        await transporter.sendMail({
          to: email,
          subject: "ConsultaPro - Password Reset Request",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>We received a request to reset your ConsultaPro password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 13px;">Or copy this link in your browser:</p>
              <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                ${resetLink}
              </p>
              <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, please ignore this email or contact support.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ConsultaPro Team</p>
            </div>
          `
        });
        console.log(`📧 Password reset email sent to: ${email}`);
      } else {
        console.warn("⚠️ Email transporter not configured, showing link in response for development");
      }
    } catch (emailErr) {
      console.error("⚠️ Failed to send reset email:", emailErr.message);
      // Still return success - email might fail but token is saved
    }

    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
      // Development only - remove in production
      ...(process.env.NODE_ENV === "development" && {
        devResetLink: resetLink,
        devResetToken: resetToken,
      }),
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({
      error: "Failed to process forgot password: " + error.message,
    });
  }
});

/**
 * POST /auth/reset-password
 * Reset password using token
 */
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword, email } = req.body;

  if (!token || !newPassword || !email) {
    return res.status(400).json({
      error: "Token, email, and new password are required",
    });
  }

  try {
    console.log(`🔄 Password reset attempt: ${email}`);

    // Hash the provided token to compare
    const tokenHash = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching reset token
    const user = await prisma.user.findFirst({
      where: {
        email,
        password_reset_token: tokenHash,
      },
    });

    if (!user) {
      console.log(`❌ Invalid reset token for: ${email}`);
      return res
        .status(400)
        .json({ error: "Invalid or expired reset token" });
    }

    // Check if token has expired
    if (new Date() > user.password_reset_expiry) {
      console.log(`❌ Reset token expired for: ${email}`);
      return res
        .status(400)
        .json({ error: "Reset token has expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { email },
      data: {
        permanent_password: hashedPassword,
        password_reset_token: null,
        password_reset_expiry: null,
      },
    });

    console.log(`✅ Password reset successful for: ${email}`);

    // Generate token for auto-login
    let loginToken;
    if (!firebaseAdminInitialized) {
      console.log("Dev mode - generating JWT token");
      loginToken = jwt.sign(
        {
          email: user.email,
          uid: user.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
        },
        process.env.JWT_SECRET || "dev-secret-key-for-testing-only",
        { algorithm: "HS256" }
      );
    } else {
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
      } catch {
        firebaseUser = await admin.auth().createUser({ email });
      }
      loginToken = await admin.auth().createCustomToken(firebaseUser.uid);
    }

    res.status(200).json({
      message: "Password reset successful",
      customToken: loginToken,
      devMode: !firebaseAdminInitialized,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Password reset error:", error.message);
    res.status(500).json({
      error: "Failed to reset password: " + error.message,
    });
  }
});

// LOGIN / CREATE USER AFTER OTP

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
            where: { email },
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
      where: { userId: user.id },
    });

    // Create or update user profile with bio and languages
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: bio || null,
        languages: languages || null,
      },
      create: {
        userId: user.id,
        bio: bio || null,
        languages: languages || null,
      },
    });

    // Create new consultant profile
    const consultant = await prisma.consultant.create({
      data: {
        userId: user.id,
        type: type || "Individual",
        domain,
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
      return res
        .status(400)
        .json({ error: "Subject and description are required" });
    }

    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let ticketData = {
      subject,
      category,
      description,
      status: "OPEN",
    };

    // 🏢 If Enterprise Owner → attach enterpriseId
    if (user.role === "ENTERPRISE_OWNER") {
      const enterprise = await prisma.enterprise.findUnique({
        where: { ownerId: user.id },
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
      data: ticketData,
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
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let whereCondition = {};

    if (user.role === "ENTERPRISE_OWNER") {
      const enterprise = await prisma.enterprise.findUnique({
        where: { ownerId: user.id },
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
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Get Support Tickets Error:", error.message);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

app.get("/enterprise/team", verifyFirebaseToken, async (req, res) => {
  try {
    // Try to find admin by firebase_uid first, then by email
    let admin = await prisma.user
      .findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      })
      .catch(() => null);

    if (!admin) {
      admin = await prisma.user
        .findUnique({
          where: { email: req.user.email },
        })
        .catch(() => null);

      // If still not found and Firebase is disabled (dev mode), create a test admin
    }

    if (!admin || admin.role !== "ENTERPRISE_ADMIN") {
      return res
        .status(403)
        .json({ error: "Not authorized. Admin role required." });
    }

    const members = await prisma.user.findMany({
      where: { role: "ENTERPRISE_MEMBER" },
      select: {
        id: true,
        email: true,
        name: true,
        is_verified: true,
      },
    });

    // Add status field to distinguish pending vs accepted invites
    const membersWithStatus = members.map(member => ({
      ...member,
      status: member.is_verified ? "Active" : "Pending Invitation"
    }));

    res.status(200).json(membersWithStatus);
  } catch (error) {
    console.error("Enterprise team error:", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

app.patch("/enterprise/team/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    let admin = await prisma.user
      .findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      })
      .catch(() => null);

    if (!admin) {
      admin = await prisma.user
        .findUnique({
          where: { email: req.user.email },
        })
        .catch(() => null);
    }

    if (!admin || admin.role !== "ENTERPRISE_ADMIN") {
      return res
        .status(403)
        .json({ error: "Not authorized. Admin role required." });
    }

    const member = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!member || member.role !== "ENTERPRISE_MEMBER") {
      return res.status(404).json({ error: "Team member not found." });
    }

    const updatedMember = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : member.name,
        email: typeof email === "string" && email.trim() ? email.trim() : member.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        is_verified: true,
      },
    });

    res.status(200).json({
      ...updatedMember,
      status: updatedMember.is_verified ? "Active" : "Pending Invitation",
    });
  } catch (error) {
    console.error("Enterprise team update error:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

app.get("/enterprise/team/:id/credentials", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify admin
    let admin = await prisma.user
      .findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      })
      .catch(() => null);

    if (!admin) {
      admin = await prisma.user
        .findUnique({
          where: { email: req.user.email },
        })
        .catch(() => null);
    }

    if (!admin || admin.role !== "ENTERPRISE_ADMIN") {
      return res
        .status(403)
        .json({ error: "Not authorized. Admin role required." });
    }

    // Get member details with credentials and profile
    const member = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        is_verified: true,
        temp_username: true,
        temp_password: true,
        created_at: true,
        profile: {
          select: {
            avatar: true,
            bio: true,
            designation: true,
            years_experience: true,
            education: true,
            languages: true,
            hourly_rate: true,
            availability: true,
            expertise: true,
            location: true,
          },
        },
      },
    });

    if (!member || member.role !== "ENTERPRISE_MEMBER") {
      return res.status(404).json({ error: "Team member not found." });
    }

    res.status(200).json({
      id: member.id,
      email: member.email,
      name: member.name,
      phone: member.phone,
      is_verified: member.is_verified,
      username: member.temp_username,
      password: member.temp_password,
      created_at: member.created_at,
      profile: member.profile,
    });
  } catch (error) {
    console.error("Get member credentials error:", error);
    res.status(500).json({ error: "Failed to fetch member credentials" });
  }
});

app.delete("/enterprise/team/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

/**
 * GET /enterprise/settings
 * Get enterprise organization settings
 */
app.get("/enterprise/settings", verifyFirebaseToken, async (req, res) => {
  try {
    let admin = await prisma.user
      .findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      })
      .catch(() => null);

    if (!admin) {
      admin = await prisma.user
        .findUnique({
          where: { email: req.user.email },
        })
        .catch(() => null);
    }

    if (!admin || admin.role !== "ENTERPRISE_ADMIN") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get team member count
    const teamCount = await prisma.user.count({
      where: { role: "ENTERPRISE_MEMBER" },
    });

    res.status(200).json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      tagline: admin.name || "Enterprise",
      description: "Enterprise Team",
      defaultPricing: 150,
      logo: "",
      allowConsultantPricing: true,
      autoAssignSessions: false,
      documents: [],
      verificationStatus: "PENDING",
      company_name: admin.name || "Enterprise",
      company_email: admin.email,
      company_phone: admin.phone || "",
      max_team_members: 50,
      current_team_members: teamCount,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch settings: " + error.message });
  }
});

/**
 * PUT /enterprise/settings
 * Update enterprise organization settings
 */
app.put(
  "/enterprise/settings",
  verifyFirebaseToken,
  upload.single("logo"),
  async (req, res) => {
    try {
      const {
        tagline,
        description,
        defaultPricing,
        allowConsultantPricing,
        autoAssignSessions,
        company_name,
        company_phone,
        company_website,
        company_description,
      } = req.body;

      let admin = await prisma.user
        .findUnique({
          where: { firebase_uid: req.user.firebase_uid },
        })
        .catch(() => null);

      if (!admin) {
        admin = await prisma.user
          .findUnique({
            where: { email: req.user.email },
          })
          .catch(() => null);
      }

      if (!admin || admin.role !== "ENTERPRISE_ADMIN") {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Update user profile with company info
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: {
          name: company_name || tagline || admin.name,
          phone: company_phone || admin.phone,
        },
      });

      res.status(200).json({
        message: "Settings updated successfully",
        id: updated.id,
        email: updated.email,
        name: updated.name,
        tagline: tagline || updated.name,
        description: description || company_description || "Enterprise Team",
        defaultPricing: defaultPricing || 150,
        logo: req.file?.secure_url || "",
        allowConsultantPricing:
          allowConsultantPricing === "true" || allowConsultantPricing === true,
        autoAssignSessions:
          autoAssignSessions === "true" || autoAssignSessions === true,
        documents: [],
        verificationStatus: "PENDING",
        company_name: company_name || tagline || updated.name,
        company_phone: company_phone || updated.phone,
        company_website: company_website || "",
        company_description:
          company_description || description || "Enterprise Team",
      });
    } catch (error) {
      console.error("Update settings error:", error.message);
      res
        .status(500)
        .json({ error: "Failed to update settings: " + error.message });
    }
  }
);

app.get("/enterprise/wallet", verifyFirebaseToken, async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { wallet: true },
    });

    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      balance: admin.wallet?.balance || 0,
    });
  } catch (error) {
    console.error("Enterprise wallet error:", error);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

app.get("/enterprise/bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        consultant: true,
      },
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Enterprise bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

/**
 * GET /consultant/profile
 * Get current user's consultant profile
 */
app.get("/consultant/profile", verifyFirebaseToken, async (req, res) => {
  try {
    // 🔥 DEV MODE USE ID NOT FIREBASE UID
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      include: {
        consultant: true,
        profile: true,
      },
    });

    if (!user || !user.consultant) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    // Combine consultant and profile data
    const kycDocuments = user.consultant.kyc_documents || [];
    const certificates = user.consultant.certificates || [];
    
    const profileData = {
      ...user.consultant,
      bio: user.profile?.bio || null,
      languages: user.profile?.languages || null,
      name: user.name,
      email: user.email,
      phone: user.phone,
      // Backward compatibility fields
      kyc_document: kycDocuments.length > 0 ? kycDocuments[0].url : null,
      kyc_document_data: kycDocuments.length > 0 ? kycDocuments[0] : null,
      certificates: certificates,
      certificate_urls: certificates.map(cert => cert.url)
    };

    res.json(profileData);
  } catch (err) {
    console.error("Get Consultant Error:", err);
    res.status(500).json({ error: "Failed to fetch consultant profile" });
  }
});

/**
 * PUT /consultant/profile
 * Update consultant profile
 */
app.put("/consultant/profile", verifyFirebaseToken, async (req, res) => {
  const { type, domain, bio, languages, hourly_price, full_name, phone, expertise, availability, designation, years_experience, education } = req.body;

  try {
    // Use consistent user lookup (same as GET endpoint)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { consultant: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.consultant) {
      return res.status(404).json({ error: "Consultant profile not found" });
    }

    // Update consultant profile (consultant-specific fields)
    const updatedConsultant = await prisma.consultant.update({
      where: { id: user.consultant.id },
      data: {
        type: type || user.consultant.type,
        domain: domain || user.consultant.domain,
        hourly_price: hourly_price
          ? parseFloat(hourly_price)
          : user.consultant.hourly_price,
        expertise: expertise || user.consultant.expertise,
        availability: availability || user.consultant.availability,
        designation: designation || user.consultant.designation,
        years_experience: years_experience !== undefined ? parseInt(years_experience) : user.consultant.years_experience,
        education: education || user.consultant.education,
      },
    });

    // Update user profile (bio and languages)
    if (bio !== undefined || languages !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          bio: bio !== undefined ? bio : user.profile?.bio,
          languages:
            languages !== undefined ? languages : user.profile?.languages,
        },
        create: {
          userId: user.id,
          bio: bio !== undefined ? bio : null,
          languages: languages !== undefined ? languages : null,
        },
      });
    }

    // Update user's name and phone if provided
    if (full_name || phone !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          name: full_name || user.name,
          phone: phone !== undefined ? phone : user.phone,
        },
      });
    }
    console.log(`✓ Consultant profile updated for user ${user.email}`);
    res.status(200).json(updatedConsultant);
  } catch (error) {
    console.error("Update Consultant Error:", error.message);
    res.status(500).json({ error: "Failed to update consultant profile" });
  }
});
app.get(
  "/consultant/dashboard-stats",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const consultant = await prisma.consultant.findFirst({
        where: { userId: req.user.id },
      });

      if (!consultant) {
       return res.json([]);
      }

      const totalSessions = await prisma.booking.count({
        where: { consultantId: consultant.id },
      });

      const completedSessions = await prisma.booking.findMany({
        where: {
          consultantId: consultant.id,
          status: "COMPLETED",
        },
      });

      const totalRevenue = completedSessions.reduce(
        (sum, b) => sum + (b.net_earning || 0),
        0
      );

      res.json({
        totalSessions,
        totalRevenue,
        averageRating: 0,
        activeClients: 0,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);
app.get("/consultant/bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const bookings = await prisma.booking.findMany({
      where: { consultantId: consultant.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { date: "desc" },
    });

    // Format the bookings to include user info and proper time display
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      user: booking.user,
      // Keep time_slot as is for now, but this represents the booked time
      time_slot: booking.time_slot
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error("Get Bookings Error:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});
app.get("/consultant/availability", verifyFirebaseToken, async (req, res) => {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const availability = await prisma.availability.findMany({
      where: {
        consultantId: consultant.id,
        available_date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
        },
      },
      orderBy: {
        available_date: "asc",
      },
    });

    res.json(availability);
  } catch (error) {
    console.error("Get Availability Error:", error.message);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

/**
 * POST /consultant/availability
 * Add new availability slot
 */
app.post("/consultant/availability", verifyFirebaseToken, async (req, res) => {
  try {
    const { date, time } = req.body;

    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const availability = await prisma.availability.create({
      data: {
        consultantId: consultant.id,
        available_date: new Date(date),
        available_time: time,
      },
    });

    res.status(201).json(availability);
  } catch (error) {
    console.error("Add Availability Error:", error.message);
    res.status(500).json({ error: "Failed to add availability" });
  }
});

/**
 * DELETE /consultant/availability/:id
 * Delete availability slot
 */
app.delete(
  "/consultant/availability/:id",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const consultant = await prisma.consultant.findFirst({
        where: { userId: req.user.id },
      });

      if (!consultant) {
        return res.status(404).json({ error: "Consultant not found" });
      }

      // Verify the availability belongs to this consultant
      const availability = await prisma.availability.findFirst({
        where: {
          id: parseInt(id),
          consultantId: consultant.id,
        },
      });

      if (!availability) {
        return res.status(404).json({ error: "Availability slot not found" });
      }

      await prisma.availability.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error("Delete Availability Error:", error.message);
      res.status(500).json({ error: "Failed to delete availability" });
    }
  }
);

app.get("/consultant/earnings", verifyFirebaseToken, async (req, res) => {
  try {
    const { period } = req.query;

    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        consultantId: consultant.id,
        status: "COMPLETED",
      },
    });

    const total = bookings.reduce((sum, b) => sum + (b.net_earning || 0), 0);

    if (period === "30days") {
      return res.json([
        { name: "Week 1", revenue: total },
        { name: "Week 2", revenue: 0 },
        { name: "Week 3", revenue: 0 },
        { name: "Week 4", revenue: 0 },
      ]);
    }

    res.json([
      { name: "Mon", revenue: total },
      { name: "Tue", revenue: 0 },
      { name: "Wed", revenue: 0 },
      { name: "Thu", revenue: 0 },
      { name: "Fri", revenue: 0 },
      { name: "Sat", revenue: 0 },
      { name: "Sun", revenue: 0 },
    ]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});
/**
 * POST /consultant/upload-profile-pic
 * Upload consultant profile picture to Cloudinary
 */
app.post(
  "/consultant/upload-profile-pic",
  verifyFirebaseToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const cloudinaryConfig = ensureCloudinaryConfigured();
      if (!cloudinaryConfig.api_key || !cloudinaryConfig.api_secret || !cloudinaryConfig.cloud_name) {
        return res.status(500).json({ error: "Cloudinary not configured on server" });
      }

      // Upload to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "consultancy-platform/profile-pics" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const uploadResult = await uploadPromise;
      const imageUrl = uploadResult.secure_url;

      // Get user - use consistent lookup with other endpoints
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { consultant: true },
      });

      if (!user || !user.consultant) {
        return res.status(404).json({ error: "Consultant profile not found" });
      }

      // Update consultant with new profile picture
      const updatedConsultant = await prisma.consultant.update({
        where: { id: user.consultant.id },
        data: { profile_pic: imageUrl },
      });

      console.log(`✓ Profile picture uploaded for ${user.email}`);
      res.status(200).json({
        message: "Profile picture uploaded successfully",
        profile_pic: imageUrl,
        consultant: updatedConsultant,
      });
    } catch (error) {
      console.error("Upload Error:", error.message);
      res
        .status(500)
        .json({ error: "Failed to upload profile picture: " + error.message });
    }
  }
);

/**
 * POST /user/upload-profile-pic
 * Upload user profile picture to Cloudinary
 */
app.post(
  "/user/upload-profile-pic",
  verifyFirebaseToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const cloudinaryConfig = ensureCloudinaryConfigured();
      if (!cloudinaryConfig.api_key || !cloudinaryConfig.api_secret || !cloudinaryConfig.cloud_name) {
        return res.status(500).json({ error: "Cloudinary not configured on server" });
      }

      console.log("🖼️ Cloudinary upload (user profile):", {
        cloud_name: cloudinaryConfig.cloud_name ? "SET" : "NOT SET",
        api_key: cloudinaryConfig.api_key ? "SET" : "NOT SET",
        api_secret: cloudinaryConfig.api_secret ? "SET" : "NOT SET",
      });

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "consultancy-platform/user-profile-pics" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const imageUrl = uploadResult.secure_url;

      const user = await prisma.user.findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ✅ Update UserProfile, not User
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: { avatar: imageUrl },
        create: {
          userId: user.id,
          avatar: imageUrl,
        },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });

      res.status(200).json({
        message: "Profile picture uploaded successfully",
        avatar: imageUrl,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      const errorMessage = error && error.message ? error.message : String(error);
      res.status(500).json({ error: "Failed to upload profile picture: " + errorMessage });
    }
  }
);

/**
 * POST /consultant/upload-kyc
 * Upload KYC documents to Cloudinary
 */
app.post(
  "/consultant/upload-kyc",
  verifyFirebaseToken,
  upload.array("files", 5), // Allow up to 5 files
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      // Find consultant for logged-in user
      const consultant = await prisma.consultant.findFirst({
        where: { userId: req.user.id },
      });

      if (!consultant) {
        return res.status(404).json({ error: "Consultant not found" });
      }

      // Upload all files to Cloudinary
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              folder: "consultancy-platform/kyc-documents",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Format documents for storage
      const documents = uploadResults.map((result, index) => ({
        id: index + 1,
        name: req.files[index].originalname,
        url: result.secure_url,
        public_id: result.public_id,
        uploaded_at: new Date().toISOString(),
        type: req.body.documentType || 'document'
      }));

      // Update consultant's KYC documents
      const existingKycDocuments = consultant.kyc_documents || [];
      const updatedKycDocuments = [...existingKycDocuments, ...documents];

      await prisma.consultant.update({
        where: { id: consultant.id },
        data: {
          kyc_documents: updatedKycDocuments,
          kyc_status: "SUBMITTED"
        },
      });

      res.status(200).json({
        message: "KYC documents uploaded successfully",
        documents: documents,
        kyc_status: "SUBMITTED"
      });
    } catch (error) {
      console.error("KYC Upload Error:", error);
      res.status(500).json({ error: "Failed to upload KYC documents" });
    }
  }
);

/**
 * POST /consultant/upload-certificates
 * Upload certificates to Cloudinary
 */
app.post(
  "/consultant/upload-certificates",
  verifyFirebaseToken,
  upload.array("files", 10), // Allow up to 10 certificates
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      // Find consultant for logged-in user
      const consultant = await prisma.consultant.findFirst({
        where: { userId: req.user.id },
      });

      if (!consultant) {
        return res.status(404).json({ error: "Consultant not found" });
      }

      // Upload all files to Cloudinary
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              folder: "consultancy-platform/certificates",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Format certificates for storage
      const certificates = uploadResults.map((result, index) => ({
        id: Date.now() + index, // Generate unique ID
        name: req.files[index].originalname,
        url: result.secure_url,
        public_id: result.public_id,
        uploaded_at: new Date().toISOString(),
        issuer: req.body.issuer || "Not specified",
        issue_date: req.body.issueDate || null,
        expiry_date: req.body.expiryDate || null,
        credential_id: req.body.credentialId || null
      }));

      // Update consultant's certificates
      const existingCertificates = consultant.certificates || [];
      const updatedCertificates = [...existingCertificates, ...certificates];

      await prisma.consultant.update({
        where: { id: consultant.id },
        data: {
          certificates: updatedCertificates,
        },
      });

      res.status(200).json({
        message: "Certificates uploaded successfully",
        certificates: certificates
      });
    } catch (error) {
      console.error("Certificates Upload Error:", error);
      res.status(500).json({ error: "Failed to upload certificates" });
    }
  }
);

/**
 * GET /consultant/kyc-status
 * Get KYC status and documents
 */
app.get("/consultant/kyc-status", verifyFirebaseToken, async (req, res) => {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
      select: {
        kyc_status: true,
        kyc_documents: true
      }
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    // For backward compatibility, return single document if only one exists
    const documents = consultant.kyc_documents || [];
    const singleDocument = documents.length > 0 ? documents[0] : null;

    res.json({
      kyc_status: consultant.kyc_status,
      documents: documents,
      kyc_document: singleDocument?.url || null, // Backward compatibility
      kyc_document_data: singleDocument || null // Full document data
    });
  } catch (error) {
    console.error("KYC Status Error:", error);
    res.status(500).json({ error: "Failed to get KYC status" });
  }
});

/**
 * GET /consultant/certificates
 * Get consultant certificates
 */
app.get("/consultant/certificates", verifyFirebaseToken, async (req, res) => {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
      select: {
        certificates: true
      }
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const certificates = consultant.certificates || [];
    
    // For backward compatibility, return array of URLs
    const certificateUrls = certificates.map(cert => cert.url);

    res.json({
      certificates: certificates,
      certificate_urls: certificateUrls // Backward compatibility
    });
  } catch (error) {
    console.error("Certificates Error:", error);
    res.status(500).json({ error: "Failed to get certificates" });
  }
});

/**
 * DELETE /consultant/certificate/:id
 * Delete a certificate
 */
app.delete("/consultant/certificate/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const certificateId = parseInt(req.params.id);
    const certificates = consultant.certificates || [];
    
    // Find the certificate to delete
    const certificateToDelete = certificates.find(cert => cert.id === certificateId);
    
    if (!certificateToDelete) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Delete from Cloudinary
    if (certificateToDelete.public_id) {
      await cloudinary.uploader.destroy(certificateToDelete.public_id);
    }

    // Remove from database
    const updatedCertificates = certificates.filter(cert => cert.id !== certificateId);
    
    await prisma.consultant.update({
      where: { id: consultant.id },
      data: {
        certificates: updatedCertificates,
      },
    });

    res.json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Delete Certificate Error:", error);
    res.status(500).json({ error: "Failed to delete certificate" });
  }
});

/**
 * DELETE /consultant/kyc-document/:id
 * Delete a KYC document
 */
app.delete("/consultant/kyc-document/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const documentId = parseInt(req.params.id);
    const kycDocuments = consultant.kyc_documents || [];
    
    // Find the document to delete
    const documentToDelete = kycDocuments.find(doc => doc.id === documentId);
    
    if (!documentToDelete) {
      return res.status(404).json({ error: "KYC document not found" });
    }

    // Delete from Cloudinary
    if (documentToDelete.public_id) {
      await cloudinary.uploader.destroy(documentToDelete.public_id);
    }

    // Remove from database
    const updatedDocuments = kycDocuments.filter(doc => doc.id !== documentId);
    
    await prisma.consultant.update({
      where: { id: consultant.id },
      data: {
        kyc_documents: updatedDocuments,
        kyc_status: updatedDocuments.length === 0 ? "PENDING" : "SUBMITTED"
      },
    });

    res.json({ message: "KYC document deleted successfully" });
  } catch (error) {
    console.error("Delete KYC Document Error:", error);
    res.status(500).json({ error: "Failed to delete KYC document" });
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
 * Get single consultant by ID
 */
app.get("/consultants/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const consultant = await prisma.consultant.findUnique({
      where: {
        id: parseInt(id),
        is_verified: true, // Only return verified consultants
      },
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
 * GET /consultants/:id/availability
 * Get available time slots for a consultant on specific date
 */
app.get("/consultants/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const consultant = await prisma.consultant.findFirst({
      where: {
        id: parseInt(id),
        is_verified: true,
      },
    });

    if (!consultant) {
      return res.status(404).json({ error: "Consultant not found" });
    }

    const availability = await prisma.availability.findMany({
      where: {
        consultantId: consultant.id,
        available_date: new Date(date),
        is_booked: false,
      },
      orderBy: {
        available_time: "asc",
      },
    });

    res.status(200).json(availability);
  } catch (error) {
    console.error("Get Availability Error:", error.message);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

/**
 * GET /consultants/online
 * Get list of online consultants
 */
app.get("/consultants/online", async (req, res) => {
  try {
    const onlineConsultantIds = Array.from(onlineConsultants.keys());

    const consultants = await prisma.consultant.findMany({
      where: {
        id: { in: onlineConsultantIds },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    res.status(200).json(consultants);
  } catch (error) {
    console.error("Get Online Consultants Error:", error.message);
    res.status(500).json({ error: "Failed to fetch online consultants" });
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
      include: { wallet: true },
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
          balance: 0,
        },
      });
    }

    res.status(200).json({
      balance: wallet.balance,
      user_id: user.id,
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
      orderBy: { amount: "asc" },
    });

    res.status(200).json(packages);
  } catch (error) {
    console.error("Get Credit Packages Error:", error.message);
    res.status(500).json({ error: "Failed to fetch credit packages" });
  }
});

app.post("/payment/create-order", verifyFirebaseToken, async (req, res) => {
  const { amount, package_id } = req.body;

  console.log("🧪 Create Order Request:", {
    amount,
    package_id,
    user: req.user,
  });

  try {
    if (!amount || amount <= 0) {
      console.log("❌ Invalid amount:", amount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!razorpay) {
      console.log("❌ Razorpay not initialized");
      return res.status(503).json({ error: "Payment service not configured" });
    }

    // Calculate bonus if package is specified
    let bonusAmount = 0;
    if (package_id) {
      console.log("🔍 Looking up package:", package_id);
      const creditPackage = await prisma.creditPackage.findUnique({
        where: { id: parseInt(package_id) },
      });
      console.log("📦 Found package:", creditPackage);
      if (creditPackage) {
        bonusAmount = creditPackage.bonus || 0;
      }
    }

    const totalAmount = amount + bonusAmount;
    const amountInPaise = totalAmount * 100; // Convert to paise

    console.log("💰 Creating order:", { totalAmount, amountInPaise });

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    console.log("📞 Calling Razorpay API...");
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (user) {
      // Save payment order to database for later verification
      await prisma.paymentOrder
        .create({
          data: {
            user_id: user.id,
            razorpay_order_id: order.id,
            amount: totalAmount,
            credits: amount, // Amount without bonus
            bonus: bonusAmount,
            status: "PENDING",
          },
        })
        .catch((err) => {
          // Log error but don't fail the request
          console.warn("Failed to save payment order to DB:", err.message);
        });
    }

    res.status(200).json({
      order_id: order.id,
      amount: totalAmount,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID,
      bonus: bonusAmount,
    });
  } catch (error) {
    console.error("❌ Create Order Error:", error.message);
    console.error("❌ Full error:", error);
    res
      .status(500)
      .json({ error: "Failed to create payment order: " + error.message });
  }
});

/**
 * GET /payment-page
 * Serve Razorpay Checkout page with proper modal display
 */
app.get("/payment-page", (req, res) => {
  const { order_id, amount, credits } = req.query;

  if (!order_id || !amount) {
    return res.status(400).send("Missing order_id or amount");
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
        <p class="description">Adding ${credits || "credits"} to your wallet</p>
        <button id="payBtn">Pay with Razorpay</button>
        <a href="http://localhost:3000/#/user/credits" class="cancel-link">Cancel</a>
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
var options = {
  key: '${razorpayKey}',
  amount: ${amountInPaise},
  currency: 'INR',
  name: 'ConsultaPro',
  description: 'Add ${credits || "credits"} credits to your wallet',
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
    document.getElementById('payBtn').disabled = true;
    document.getElementById('payBtn').innerText = 'Verifying...';

    fetch('http://localhost:5001/payment/verify', {
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
        alert('Payment successful! ' + data.amount_added + ' credits have been added to your wallet.');
        window.location.href = 'http://localhost:3000/#/user/credits?payment=success&credits=' + encodeURIComponent(data.amount_added);
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
};

var rzp = new Razorpay(options);
rzp.open();
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } =
    req.body;

  try {
    if (!razorpay) {
      return res.status(503).json({ error: "Payment service not configured" });
    }

    // Verify payment signature (cryptographically secure)
    const crypto = require("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

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
      where: { razorpay_order_id: razorpay_order_id },
    });

    if (!orderRecord) {
      console.warn(
        `Order not found in DB: ${razorpay_order_id}, but signature is valid`
      );
      // If order not in DB but signature is valid, still process it
      // This handles edge cases where order was created but DB record is missing
      return res.status(200).json({
        message: "Payment signature verified but order not found in system",
        payment_id: razorpay_payment_id,
        note: "Please contact support if credits are not added",
      });
    }
    // 🔒 Prevent double processing of same order
    if (orderRecord.status === "COMPLETED") {
      console.warn(
        "⚠️ Payment already processed for order:",
        razorpay_order_id
      );
      return res.status(200).json({
        message: "Payment already processed",
        already_processed: true,
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: orderRecord.user_id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found for this order" });
    }

    // Create or get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });
    }

    const creditsToAdd = orderRecord.credits || amount;
    const bonusAmount = orderRecord.bonus || 0;
    const totalCredits = creditsToAdd + bonusAmount;

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + totalCredits,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "CREDIT",
          amount: totalCredits,
          description: `Added ${creditsToAdd} credits${
            bonusAmount > 0 ? ` with ${bonusAmount} bonus` : ""
          } via Razorpay (Order: ${razorpay_order_id})`,
          payment_method: "RAZORPAY",
          status: "SUCCESS",
        },
      });

      await tx.paymentOrder.update({
        where: { id: orderRecord.id },
        data: {
          status: "COMPLETED",
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
        },
      });

      return updatedWallet;
    });

    const updatedWallet = result;
    await prisma.paymentOrder.update({
      where: { id: orderRecord.id },
      data: {
        status: "COMPLETED",
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
      },
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
              <div class="value">${new Date().toLocaleDateString("en-IN")}</div>

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
                  ${
                    bonusAmount > 0
                      ? `<tr>
                    <td>${bonusAmount} Bonus Credits</td>
                    <td style="text-align: right; color: #16a34a;">FREE</td>
                  </tr>`
                      : ""
                  }
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
    if (transporter && isEmailConfigured) {
      // Generate PDF invoice in background
      (async () => {
        try {
          const invoiceData = {
            invoiceNumber: razorpay_order_id,
            date: new Date().toLocaleDateString("en-IN"),
            paymentId: razorpay_payment_id,
            userEmail: user.email,
            status: "PAID",
            credits: creditsToAdd,
            amount: orderRecord.amount,
            bonus: bonusAmount,
            totalCredits: totalCredits,
          };

          // Generate PDF buffer
          const pdfBuffer = await generateInvoicePDF(invoiceData);

          // Send email with PDF attachment
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Payment Invoice - ConsultaPro Credits Purchase",
            html: invoiceHtml,
            attachments: [
              {
                filename: `Invoice_${razorpay_order_id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });

          console.log(`✅ Invoice PDF sent successfully to ${user.email}`);
        } catch (err) {
          console.error(
            `Failed to send invoice email with PDF to ${user.email}:`,
            err.message
          );
          // Fallback: Try sending without PDF
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: "Payment Invoice - ConsultaPro Credits Purchase",
              html: invoiceHtml,
            });
            console.log(`✅ Invoice email sent (without PDF) to ${user.email}`);
          } catch (fallbackErr) {
            console.error(
              `Failed to send invoice email to ${user.email}:`,
              fallbackErr.message
            );
          }
        }
      })();
    } else {
      console.log(
        `📧 Email not configured - skipping invoice email for ${user.email}`
      );
    }
    console.log(
      `✓ Payment verified and ${totalCredits} credits added to user ${user.email}`
    );
    console.log(`📧 Invoice email sent to ${user.email}`);
    res.status(200).json({
      message: "Payment successful and credits added",
      amount_added: totalCredits,
      bonus: bonusAmount,
      new_balance: updatedWallet.balance,
      payment_id: razorpay_payment_id,
      success: true,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to verify payment: " + error.message });
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
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create or get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });
    }

    // Calculate bonus if package is specified
    let bonusAmount = 0;
    if (package_id) {
      const creditPackage = await prisma.creditPackage.findUnique({
        where: { id: parseInt(package_id) },
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
        balance: wallet.balance + totalCredits,
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "CREDIT",
        amount: totalCredits,
        description: `Added ₹${amount} credits${
          bonusAmount > 0 ? ` with ₹${bonusAmount} bonus` : ""
        }`,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
      },
    });

    console.log(`✓ Added ₹${totalCredits} credits to user ${user.email}`);
    res.status(200).json({
      message: "Credits added successfully",
      amount_added: totalCredits,
      bonus: bonusAmount,
      new_balance: updatedWallet.balance,
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
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { created_at: "desc" },
      take: 50, // Limit to last 50 transactions
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
      include: { wallet: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get consultant details to check fee
    // Validate consultant_id
    const consultantId = parseInt(consultant_id);
    if (isNaN(consultantId) || consultantId <= 0) {
      return res.status(400).json({ error: "Invalid consultant ID format" });
    }

    const consultant = await prisma.consultant.findUnique({
      where: { id: consultantId },
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
          balance: 0,
        },
      });
    }

    // Check if user has sufficient balance
    if (wallet.balance < consultant.hourly_price) {
      return res.status(400).json({
        error: "Insufficient balance",
        required: consultant.hourly_price,
        current: wallet.balance,
      });
    }

    // Deduct amount from wallet
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance - consultant.hourly_price,
      },
    });

    // Create booking with payment details
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        consultantId: parseInt(consultant_id),
        date: new Date(date),
        time_slot: time_slot || "10:00 AM",
        status: "PENDING", // Changed from CONFIRMED to PENDING
        is_paid: true,
        consultant_fee: consultant.hourly_price,
        commission_fee: consultant.hourly_price * 0.1, // 10% commission
        net_earning: consultant.hourly_price * 0.9, // 90% to consultant
      },
    });

    // Mark the availability slot as booked
    await prisma.availability.updateMany({
      where: {
        consultantId: parseInt(consultant_id),
        available_date: new Date(date),
        available_time: time_slot,
        is_booked: false, // Only update unbooked slots
      },
      data: { is_booked: true },
    });

    console.log(
      `📅 Booking ${booking.id} created for user ${user.email} with consultant ${consultant_id}`
    );

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
        status: "SUCCESS",
      },
    });

    console.log(
      `✓ Booking created: User ${user.email} → Consultant ${consultant_id}, Fee: ₹${consultant.hourly_price}`
    );
    res.status(201).json({
      ...booking,
      message: "Booking confirmed and payment processed",
      remaining_balance: updatedWallet.balance,
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
          include: { user: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.call_completed) {
      return res.status(400).json({ error: "Call already completed" });
    }

    // Verify that the requester is either the user or consultant involved
    const requester = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (
      !requester ||
      (requester.id !== booking.userId &&
        requester.id !== booking.consultant.userId)
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to complete this booking" });
    }

    // Update booking as completed
    const completedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        call_completed: true,
        call_duration: call_duration || 60, // Default 60 minutes if not provided
        completed_at: new Date(),
        status: "COMPLETED",
      },
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
        status: "SUCCESS",
      },
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
        status: "SUCCESS",
      },
    });

    console.log(
      `✓ Call completed: Booking #${bookingId}, Platform earned ₹${booking.commission_fee}, Consultant earned ₹${booking.net_earning}`
    );

    res.status(200).json({
      message: "Call completed successfully",
      booking: completedBooking,
      commission_fee: booking.commission_fee,
      consultant_earning: booking.net_earning,
    });
  } catch (error) {
    console.error("Complete Booking Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to complete booking: " + error.message });
  }
});

/**
 * GET /bookings
 * Get user's bookings
 */
app.get("/bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const consultantProfile = await prisma.consultant.findFirst({
      where: {
        userId: req.user.id,
      },
    });

    let bookings;

    // 👇 IF CONSULTANT
    if (consultantProfile) {
      bookings = await prisma.booking.findMany({
        where: {
          consultantId: consultantProfile.id,
        },
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
    }
    // 👇 IF CLIENT
    else {
      bookings = await prisma.booking.findMany({
        where: {
          userId: req.user.id,
        },
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
    }

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});
// ... previous code ...

/**
 * GET /bookings/:id/messages
 * Get all messages for a specific booking
 */
// In index.js - update the GET /bookings/:id/messages endpoint
app.get("/bookings/:id/messages", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);

    // Verify user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        consultant: true,
        enterpriseMember: true, // Keep this
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user is authorized (client, consultant, OR enterprise member)
    const requester = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!requester) {
      return res.status(404).json({ error: "User not found" });
    }

    const isClient = booking.userId === requester.id;
    const isConsultant = booking.consultant?.userId === requester.id;
    // 👇 ADD THIS LINE - Check if user is the enterprise member
    const isEnterpriseMember = booking.enterpriseMemberId === requester.id;

    // 👇 MODIFY THIS CONDITION - Include enterprise member
    if (!isClient && !isConsultant && !isEnterpriseMember) {
      return res
        .status(403)
        .json({ error: "Not authorized to view these messages" });
    }

    // Fetch messages with sender info
    const messages = await prisma.message.findMany({
      where: { bookingId: bookingId },
      orderBy: { created_at: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true, // 👈 Also add role for better UI
          },
        },
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch Messages Error:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /bookings/:id/messages
 * Send a message for a specific booking
 */
app.post("/bookings/:id/messages", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const bookingId = parseInt(id);

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { consultant: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Check if user is either client or consultant
    const isClient = booking.userId === sender.id;
    const isConsultant = booking.consultant?.userId === sender.id;

    if (!isClient && !isConsultant) {
      return res.status(403).json({ error: "Not authorized to send messages" });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        bookingId: bookingId,
        senderId: sender.id,
        content: content.trim(),
      },
    });

    // Emit real-time message via Socket.IO
    io.to(`booking_${bookingId}`).emit("new_message", {
      id: message.id,
      bookingId: bookingId,
      senderId: sender.id,
      content: message.content,
      created_at: message.created_at,
      sender: {
        id: sender.id,
        email: sender.email,
      },
    });

    console.log(
      `💬 Message sent in booking ${bookingId} by user ${sender.email}`
    );

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * PUT /bookings/:id/status
 * Update booking status (accept/reject by consultant)
 */
app.put("/bookings/:id/status", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED, REJECTED, CANCELLED
    const bookingId = parseInt(id);

    if (!["ACCEPTED", "REJECTED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get booking with consultant info
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { consultant: true, user: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify the requester is the consultant
    const consultant = await prisma.consultant.findFirst({
      where: { userId: req.user.id },
    });

    if (!consultant || consultant.id !== booking.consultantId) {
      return res
        .status(403)
        .json({ error: "Only consultant can update booking status" });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    // Handle status-specific logic
    if (status === "REJECTED") {
      // Refund credits to user wallet
      await prisma.wallet.update({
        where: { userId: booking.userId },
        data: {
          balance: {
            increment: booking.consultant_fee,
          },
        },
      });

      // Make the time slot available again
      await prisma.availability.updateMany({
        where: {
          consultantId: consultant.id,
          available_date: booking.date,
          available_time: booking.time_slot,
        },
        data: { is_booked: false },
      });

      console.log(
        `❌ Booking ${bookingId} REJECTED by consultant ${consultant.id}`
      );
    } else if (status === "ACCEPTED") {
      console.log(
        `✅ Booking ${bookingId} ACCEPTED by consultant ${consultant.id}`
      );
    }

    // Emit real-time status update via Socket.IO
    io.to(`booking_${bookingId}`).emit("booking_status_update", {
      bookingId: bookingId,
      status: status,
      updatedBy: consultant.id,
      timestamp: new Date(),
    });

    res.status(200).json({
      message: `Booking ${status.toLowerCase()} successfully`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Status Error:", error.message);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

app.get("/agora/token", async (req, res) => {
  const { channelName, userId } = req.query;

  if (!channelName || !userId) {
    return res
      .status(400)
      .json({ error: "channelName and userId are required" });
  }

  try {
    const dbUserId = Number(userId);
    const bookingId = parseInt(channelName.split("_")[1]);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        consultant: true,
        enterpriseMember: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const isClient = booking.userId === dbUserId;
    const isConsultant = booking.consultant?.userId === dbUserId;
    const isEnterpriseMember = booking.enterpriseMemberId === dbUserId;

    if (!isClient && !isConsultant && !isEnterpriseMember) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // ✅ Generate unique Agora UID HERE
    const agoraUid = Math.floor(Math.random() * 1000000);

    const token = generateAgoraToken(channelName, agoraUid);

    res.json({ token, uid: agoraUid });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate token" });
  }
});
/* ================= AUTH ME ================= */

const PORT = process.env.PORT || 5001;

io.use(async (socket, next) => {
  try {
    const { email, userId } = socket.handshake.auth;

    if (!email || !userId) {
      console.log("❌ Missing email or userId in Socket Auth");
      return next(new Error("Missing credentials"));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ Socket User Not Found");
      return next(new Error("User not found"));
    }

    // Verify that the userId matches
    if (user.id !== parseInt(userId)) {
      console.log("❌ User ID mismatch");
      return next(new Error("Invalid user"));
    }

    socket.user = user;
    // 👇 CHANGE THIS LINE ONLY - add role to log
    console.log(
      "✅ Socket User Attached:",
      user.email,
      "User ID:",
      user.id,
      "Role:",
      user.role
    );
    next();
  } catch (err) {
    console.log("Socket Auth Error:", err);
    next(new Error("Auth failed"));
  }
});
io.on("connection", (socket) => {
  const user = socket.user;
  console.log("🔌 Connected:", user.email);
  // ================= MARK CONSULTANT ONLINE =================
  if (user.role === "CONSULTANT") {
    onlineConsultants.set(user.id, socket.id);
    console.log("🟢 Consultant online:", user.email);
  }
  // 👇 ADD THIS - Enterprise Member online check
  if (user.role === "ENTERPRISE_MEMBER") {
    onlineConsultants.set(user.id, socket.id);
    console.log("🟢 Enterprise Member online:", user.email);
  }
  /* ================= JOIN BOOKING ================= */
  socket.on("join-booking", async ({ bookingId }) => {
    console.log("📨 join-booking event received from:", user.email);
    try {
      // 👇 CHANGE THIS - include enterpriseMember in the query
      const booking = await prisma.booking.findUnique({
        where: { id: Number(bookingId) },
        include: {
          consultant: true,
          enterpriseMember: true, // 👈 ADD THIS
        },
      });

      if (!booking) {
        console.log("❌ Booking not found");
        return;
      }

      const userId = Number(user.id);
      const bookingUserId = Number(booking.userId);
      const bookingConsultantUserId = Number(booking.consultant?.userId);
      // 👇 ADD THIS - get enterprise member ID
      const bookingMemberUserId = Number(booking.enterpriseMemberId);

      // 👇 MODIFY THIS - add enterprise member check
      if (
        userId !== bookingUserId &&
        userId !== bookingConsultantUserId &&
        userId !== bookingMemberUserId
      ) {
        console.log("❌ Unauthorized join attempt:", user.email);
        return;
      }

      socket.join(`booking_${Number(bookingId)}`);

      // 👇 CHANGE THIS - add role to log
      console.log(`${user.email} (${user.role}) joined booking_${bookingId}`);

      // 👇 ADD THIS OPTIONAL - notify others in the room
      socket.to(`booking_${Number(bookingId)}`).emit("user-joined", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      console.log("Join Booking Error:", err);
    }
  });
  /* ================= LEAVE BOOKING ================= */
  socket.on("leave-booking", ({ bookingId }) => {
    console.log(
      `👋 User ${user.email} (${user.role}) leaving booking_${bookingId}`
    );
    socket.leave(`booking_${Number(bookingId)}`);

    // 👇 ADD THIS - notify others
    socket.to(`booking_${Number(bookingId)}`).emit("user-left", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  });
  /* ================= CHAT ================= */

  /* ================= SEND MESSAGE ================= */
  socket.on("send-message", async ({ bookingId, content }) => {
    try {
      const id = Number(bookingId);

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return socket.emit("chat-blocked", {
          message: "Booking not found",
        });
      }

      if (!booking.is_paid) {
        const messageCount = await prisma.message.count({
          where: { bookingId: id },
        });

        if (messageCount >= 5) {
          return socket.emit("chat-blocked", {
            message: "Free chat limit reached. Please complete payment.",
          });
        }
      }

      // 3️⃣ Save message with user info - NO CHANGE
      const message = await prisma.message.create({
        data: {
          bookingId: id,
          senderId: user.id,
          content,
        },
      });

      // 4️⃣ 👇 MODIFY THIS - add role to sender info
      const messageWithSender = {
        ...message,
        sender: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // 👈 ADD THIS
        },
      };

      io.to(`booking_${id}`).emit("receive-message", messageWithSender);

      // 👇 CHANGE THIS - add role to log
      console.log(
        `📨 Message sent in booking_${id} from ${user.email} (${user.role})`
      );
    } catch (err) {
      console.log("CHAT ERROR:", err);
      socket.emit("chat-error", { message: "Failed to send message" });
    }
  });
  /* ================= VIDEO START ================= */
  socket.on("start-video-call", ({ bookingId, callerId }) => {
    console.log(
      "📢 Starting video call for booking:",
      bookingId,
      "caller:",
      callerId,
      "role:",
      user.role // 👈 ADD THIS
    );

    io.to(`booking_${bookingId}`).emit("video-call-started", {
      bookingId: bookingId,
      callerId: callerId,
      callerName: user.name || user.email, // 👈 IMPROVE THIS
      callerRole: user.role, // 👈 ADD THIS
    });
  });
  /* ================= TYPING INDICATOR ================= */
  socket.on("typing", ({ bookingId, isTyping }) => {
    socket.to(`booking_${bookingId}`).emit("user-typing", {
      userId: user.id,
      email: user.email,
      role: user.role,
      isTyping,
    });
  });

  // 👇 ADD THIS NEW HANDLER - user joined video call
  socket.on("user-joined-video", ({ bookingId, userId }) => {
    console.log(`📹 User ${userId} joined video call for booking ${bookingId}`);
    socket.to(`booking_${bookingId}`).emit("remote-user-joined", {
      userId,
      message: "A participant has joined the video call",
    });
  });

  /* ================= VIDEO END ================= */
  socket.on("end-video-call", ({ bookingId }) => {
    console.log(
      `📹 Video call ended for booking ${bookingId} by ${user.email} (${user.role})`
    ); // 👈 ADD THIS
    io.to(`booking_${bookingId}`).emit("video-call-ended", {
      endedBy: user.id,
      endedByEmail: user.email,
      endedByRole: user.role, // 👈 ADD THIS
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", user.email, "Role:", user.role); // 👈 ADD THIS

    // 👇 MODIFY THIS - remove both consultants and enterprise members
    if (user.role === "CONSULTANT" || user.role === "ENTERPRISE_MEMBER") {
      onlineConsultants.delete(user.id);
      console.log(`🔴 ${user.role} offline:`, user.email);
    }
  });
});
/* ================= TEST BOOKING ================= */

app.get("/dev-create-booking", async (req, res) => {
  try {
    // Get 1 normal USER
    const client = await prisma.user.findFirst({
      where: { role: "USER" },
    });

    // Get consultant USER
    const consultantUser = await prisma.user.findFirst({
      where: { role: "CONSULTANT" },
    });

    if (!client || !consultantUser)
      return res.json({ msg: "Need 1 USER and 1 CONSULTANT logged in" });

    // Get consultant table entry
    const consultant = await prisma.consultant.findUnique({
      where: { userId: consultantUser.id },
    });

    if (!consultant)
      return res.json({ msg: "Consultant profile not created yet" });

    const booking = await prisma.booking.create({
      data: {
        userId: client.id,
        consultantId: consultant.id, // ✅ CORRECT NOW
        date: new Date(),
        time_slot: "10:00 AM",
        is_paid: true,
        status: "CONFIRMED",
      },
    });

    res.json(booking);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});
app.get("/dev-create-consultant", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { role: "CONSULTANT" },
    });

    if (!user) return res.json({ msg: "Consultant user not found" });

    const existing = await prisma.consultant.findUnique({
      where: { userId: user.id },
    });

    if (existing) return res.json({ msg: "Already created" });

    const consultant = await prisma.consultant.create({
      data: {
        userId: user.id,
      },
    });

    res.json(consultant);
  } catch (e) {
    res.json(e);
  }
});

app.get("/dev-verify-consultant", async (req, res) => {
  try {
    const consultant = await prisma.consultant.updateMany({
      where: { is_verified: false },
      data: { is_verified: true },
    });

    res.json({ message: "All consultants verified", count: consultant.count });
  } catch (e) {
    res.json(e);
  }
});

/**
 * DEV: Set a user to ENTERPRISE_MEMBER role
 * Usage: GET /dev-set-member-role?userId=9
 */
app.get("/dev-set-member-role", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter required" });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: "ENTERPRISE_MEMBER" },
    });

    res.json({
      message: "User role updated to ENTERPRISE_MEMBER",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: Check user data
 * Usage: GET /dev-check-user?userId=9
 */
app.get("/dev-check-user", async (req, res) => {
  try {
    const { userId, email } = req.query;

    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } else {
      return res.status(400).json({ error: "userId or email required" });
    }

    if (!user) {
      return res.json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firebase_uid: user.firebase_uid,
        name: user.name,
        enterpriseId: user.enterpriseId,
      },
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: List all enterprises
 */
app.get("/dev-enterprises", async (req, res) => {
  try {
    const enterprises = await prisma.enterprise.findMany({
      select: { id: true, name: true },
    });
    res.json({ enterprises });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: Create test enterprise
 * Usage: GET /dev-create-enterprise?name=Test%20Corp&ownerId=1
 */
app.get("/dev-create-enterprise", async (req, res) => {
  try {
    const name = req.query.name || "Test Enterprise";
    const ownerId = req.query.ownerId ? parseInt(req.query.ownerId) : null;

    // Find a user to be the owner
    let owner;
    if (ownerId) {
      owner = await prisma.user.findUnique({ where: { id: ownerId } });
    } else {
      // Use first ENTERPRISE_ADMIN or first user
      owner = await prisma.user.findFirst({
        where: { role: "ENTERPRISE_ADMIN" },
      });
      if (!owner) {
        owner = await prisma.user.findFirst();
      }
    }

    if (!owner) {
      return res.json({
        error: "No user found to be enterprise owner",
      });
    }

    const enterprise = await prisma.enterprise.create({
      data: {
        name,
        ownerId: owner.id,
      },
    });

    res.json({
      message: "Enterprise created",
      enterprise,
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: Assign user to enterprise
 * Usage: GET /dev-assign-to-enterprise?userId=9&enterpriseId=1
 */
app.get("/dev-assign-to-enterprise", async (req, res) => {
  try {
    const { userId, enterpriseId } = req.query;

    if (!userId || !enterpriseId) {
      return res
        .status(400)
        .json({ error: "userId and enterpriseId query parameters required" });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { enterpriseId: parseInt(enterpriseId) },
    });

    res.json({
      message: "User assigned to enterprise",
      user: { id: user.id, email: user.email, enterpriseId: user.enterpriseId },
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: Test member profile access (without auth)
 * Shows what a member profile would return
 */
app.get("/dev-member-profile-test", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "userId query parameter required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        enterprise: true,
        ownedEnterprise: true,
        profile: true,
      },
    });

    if (!user) {
      return res.json({ error: "User not found", userId });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        enterpriseId: user.enterpriseId,
        enterprise: user.enterprise
          ? { id: user.enterprise.id, name: user.enterprise.name }
          : null,
      },
      profile: user.profile,
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: Generate dev token for a user
 * Usage: GET /dev-generate-token?userId=9
 */
app.get("/dev-generate-token", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    // Create JWT-formatted token (header.payload.signature)
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      email: user.email,
      uid: user.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    })).toString('base64');
    const signature = Buffer.from("dev-mode-signature").toString('base64');
    const token = `${header}.${payload}.${signature}`;

    res.json({
      message: "Dev token generated",
      user: { id: user.id, email: user.email, role: user.role },
      token: token,
      instructions: "Copy this token and run in browser console: localStorage.setItem('devToken', '" + token + "'); location.reload();"
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

/**
 * DEV: Clear all data from Consultant, User, and Enterprise tables
 * WARNING: This will delete ALL records - use with caution!
 * Usage: GET /dev-clear-tables
 */
app.get("/dev-clear-tables", async (req, res) => {
  try {
    const confirmToken = req.query.confirm;

    if (confirmToken !== "YES_DELETE_ALL_DATA") {
      return res.status(400).json({
        error: "SAFETY CHECK: Pass ?confirm=YES_DELETE_ALL_DATA to confirm deletion",
        warning: "This will permanently delete all data from Consultant, User, and Enterprise tables",
        usage: "GET /dev-clear-tables?confirm=YES_DELETE_ALL_DATA"
      });
    }

    console.log("🗑️  CLEARING ALL DATA FROM CONSULTANT, USER, AND ENTERPRISE TABLES");

    // Delete in order to avoid foreign key constraint violations
    // Need to delete in reverse order of dependencies
    
    // 1. Delete all Consultant records first
    const consultantCount = await prisma.consultant.deleteMany({});
    console.log(`✅ Deleted ${consultantCount.count} Consultant records`);

    // 2. Delete all UserProfile records
    const profileCount = await prisma.userProfile.deleteMany({});
    console.log(`✅ Deleted ${profileCount.count} UserProfile records`);

    // 3. Delete all Enterprise records (before User, since User references Enterprise)
    const enterpriseCount = await prisma.enterprise.deleteMany({});
    console.log(`✅ Deleted ${enterpriseCount.count} Enterprise records`);

    // 4. Finally delete all User records
    const userCount = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${userCount.count} User records`);

    res.json({
      success: true,
      message: "All data cleared successfully!",
      deleted: {
        consultants: consultantCount.count,
        profiles: profileCount.count,
        enterprises: enterpriseCount.count,
        users: userCount.count,
      },
      total: consultantCount.count + profileCount.count + enterpriseCount.count + userCount.count,
      warning: "⚠️ This data has been permanently deleted from the database"
    });

  } catch (error) {
    console.error("❌ Error clearing tables:", error.message);
    res.status(500).json({
      error: "Failed to clear tables: " + error.message
    });
  }
});

// ================= ENTERPRISE MEMBER ENDPOINTS =================

/**
 * GET /enterprise/member/profile
 * Get enterprise member profile
 */
app.get("/enterprise/member/profile", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("🔍 Member profile endpoint called");
    console.log("📋 req.user:", {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      firebase_uid: req.user?.firebase_uid,
    });

    // First try to find by firebase_uid from token
    let user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: {
        enterprise: true,
        ownedEnterprise: true,
        profile: true,
      },
    });

    // If not found by firebase_uid, try by email
    if (!user && req.user.email) {
      console.log("⚠️ User not found by firebase_uid, trying by email:", req.user.email);
      user = await prisma.user.findUnique({
        where: { email: req.user.email },
        include: {
          enterprise: true,
          ownedEnterprise: true,
          profile: true,
        },
      });
    }

    // If still not found, try by ID if req.user has it
    if (!user && req.user.id) {
      console.log("⚠️ User not found by email, trying by ID:", req.user.id);
      user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          enterprise: true,
          ownedEnterprise: true,
          profile: true,
        },
      });
    }

    console.log("✓ User found:", { id: user?.id, role: user?.role, email: user?.email });

    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    if (user.role !== "ENTERPRISE_MEMBER" && user.role !== "ENTERPRISE_ADMIN") {
      return res.status(403).json({
        error: "Not authorized",
        userRole: user.role,
        expectedRoles: ["ENTERPRISE_MEMBER", "ENTERPRISE_ADMIN"],
      });
    }

    const enterprise = user.enterprise || user.ownedEnterprise || null;

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      user: user,
      role: user.role,
      phone: user.phone,
      enterprise: enterprise
        ? {
            id: enterprise.id,
            name: enterprise.name,
            logo: enterprise.logo,
          }
        : null,
      profile: user.profile,
    });
  } catch (error) {
    console.error("Get member profile error:", error);
    res.status(500).json({ error: "Failed to fetch member profile" });
  }
});

/**
 * POST /enterprise/member/kyc/upload
 * Upload KYC documents (ID proof, address proof, additional docs)
 */
app.post("/enterprise/member/kyc/upload", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { document_type, file_data, file_name } = req.body;

    if (!document_type || !file_data || !file_name) {
      return res.status(400).json({ 
        error: "Missing required fields: document_type, file_data, file_name" 
      });
    }

    // Validate document type
    const validTypes = ["id_proof", "address_proof", "additional"];
    if (!validTypes.includes(document_type)) {
      return res.status(400).json({ 
        error: `Invalid document type. Must be one of: ${validTypes.join(", ")}` 
      });
    }

    // Validate file data (base64)
    if (!file_data.startsWith("data:")) {
      return res.status(400).json({ 
        error: "File data must be in base64 format (data URI)" 
      });
    }

    // Get or create user profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { firebase_uid: firebaseUid },
    });

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Upload to Cloudinary
    try {
      const cloudinaryConfig = ensureCloudinaryConfigured();
      if (!cloudinaryConfig.api_key || !cloudinaryConfig.api_secret || !cloudinaryConfig.cloud_name) {
        return res.status(500).json({ error: "Cloudinary not configured on server" });
      }

      const uploadResponse = await cloudinary.uploader.upload(file_data, {
        folder: "consultancy-platform/kyc-documents",
        resource_type: "auto",
        public_id: `${userProfile.id}_${document_type}_${Date.now()}`,
        overwrite: false,
      });

      // Prepare document metadata
      const documentMetadata = {
        document_type,
        url: uploadResponse.secure_url,
        file_name,
        public_id: uploadResponse.public_id,
        uploaded_at: new Date().toISOString(),
        size: uploadResponse.bytes,
      };

      // Update the appropriate field based on document type
      const updateData = {
        kyc_submitted_at: new Date(),
      };

      if (document_type === "id_proof") {
        updateData.id_proof_url = uploadResponse.secure_url;
      } else if (document_type === "address_proof") {
        updateData.address_proof_url = uploadResponse.secure_url;
      } else if (document_type === "additional") {
        // Add to array of additional documents
        const existingDocs = Array.isArray(userProfile.kyc_documents) 
          ? userProfile.kyc_documents 
          : [];
        updateData.kyc_documents = [...existingDocs, documentMetadata];
      }

      // Set status to SUBMITTED if not already approved/rejected
      if (userProfile.kyc_status !== "APPROVED" && userProfile.kyc_status !== "REJECTED") {
        updateData.kyc_status = "SUBMITTED";
      }

      // Update the profile
      const updatedProfile = await prisma.userProfile.update({
        where: { id: userProfile.id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        message: `${document_type} uploaded successfully`,
        profile: updatedProfile,
        document: documentMetadata,
      });
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      res.status(500).json({ 
        error: "Failed to upload document to cloud storage",
        details: uploadError.message 
      });
    }
  } catch (error) {
    console.error("KYC upload error:", error);
    res.status(500).json({ error: "Failed to upload KYC documents" });
  }
});

/**
 * POST /enterprise/member/onboarding
 * Complete member onboarding with full profile details
 */
app.post("/enterprise/member/onboarding", verifyFirebaseToken, async (req, res) => {
  try {
    const {
      profile_photo,
      bio,
      expertise,
      languages,
      hourly_rate,
      availability,
      designation,
      years_experience,
      education,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { profile: true },
    });

    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    // Allow both ENTERPRISE_MEMBER and ENTERPRISE_ADMIN for testing
    if (user.role !== "ENTERPRISE_MEMBER" && user.role !== "ENTERPRISE_ADMIN") {
      return res.status(403).json({ error: "Not authorized. Only enterprise users can complete onboarding." });
    }

    // Update user with profile photo and designation
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profile_photo: profile_photo || user.profile_photo,
      },
    });

    // Update or create comprehensive user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: bio || "",
        expertise: expertise || [],
        languages: languages || "English",
        hourly_rate: hourly_rate || null,
        availability: availability || "Full-time",
        designation: designation || null,
        years_experience: years_experience || null,
        education: education || null,
      },
      create: {
        userId: user.id,
        bio: bio || "",
        expertise: expertise || [],
        languages: languages || "English",
        hourly_rate: hourly_rate || null,
        availability: availability || "Full-time",
        designation: designation || null,
        years_experience: years_experience || null,
        education: education || null,
        kyc_status: "PENDING",
      },
    });

    console.log(`✓ Member onboarding completed for ${updatedUser.email}`);

    res.json({
      message: "Onboarding completed successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        profile_photo: updatedUser.profile_photo,
      },
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Member onboarding error:", error);
    res.status(500).json({ error: "Failed to complete onboarding: " + error.message });
  }
});

/**
 * PATCH /enterprise/member/profile
 * Update enterprise member profile
 */
app.patch("/enterprise/member/profile", verifyFirebaseToken, async (req, res) => {
  try {
    const { name, phone, bio, expertise, availability, profile_photo } = req.body;

    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { profile: true },
    });

    if (!user || (user.role !== "ENTERPRISE_MEMBER" && user.role !== "ENTERPRISE_ADMIN")) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        phone: phone || user.phone,
        profile_photo: profile_photo || user.profile_photo,
      },
    });

    // Update or create user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: bio !== undefined ? bio : undefined,
        expertise: expertise !== undefined ? expertise : undefined,
        availability: availability !== undefined ? availability : undefined,
      },
      create: {
        userId: user.id,
        bio: bio || "",
        expertise: expertise || [],
        availability: availability || "",
      },
    });

    console.log(`✓ Member profile updated for ${updatedUser.email}`);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        profile_photo: updatedUser.profile_photo,
      },
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update member profile error:", error);
    res.status(500).json({ error: "Failed to update member profile: " + error.message });
  }
});

/**
 * GET /availability
 * Get member's available consultation slots
 */
app.get("/availability", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return empty array for now - availability slots can be added later
    // This can be extended to fetch actual availability from the database
    res.json([]);
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

/**
 * GET /reviews/member
 * Get reviews for the current member
 */
app.get("/reviews/member", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user.firebase_uid },
      include: { consultant: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.consultant) {
      return res.json([]);
    }

    // Fetch reviews for this member/consultant
    const reviews = await prisma.review.findMany({
      where: { consultantId: user.consultant.id },
      include: {
        reviewer: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json(reviews || []);
  } catch (error) {
    console.error("Get member reviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * GET /enterprise/member/available-clients
 * Get clients available for enterprise members to book
 */
app.get(
  "/enterprise/member/available-clients",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { firebase_uid: req.user.firebase_uid },
        include: { enterprise: true },
      });

      if (!user || (user.role !== "ENTERPRISE_MEMBER" && user.role !== "ENTERPRISE_ADMIN") || !user.enterprise) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get all users with role USER who are verified
      const clients = await prisma.user.findMany({
        where: {
          role: "USER",
          is_verified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          profile: {
            select: {
              avatar: true,
              bio: true,
              headline: true,
            },
          },
        },
      });

      res.json(clients);
    } catch (error) {
      console.error("Fetch available clients error:", error);
      res.status(500).json({ error: "Failed to fetch available clients" });
    }
  }
);

/**
 * POST /enterprise/member/bookings/create
 * Create a booking as an enterprise member with a client
 */
app.post(
  "/enterprise/member/bookings/create",
  verifyFirebaseToken,
  async (req, res) => {
    const { client_id, date, time_slot } = req.body;

    try {
      if (!client_id || !date || !time_slot) {
        return res
          .status(400)
          .json({ error: "client_id, date, and time_slot are required" });
      }

      const user = await prisma.user.findUnique({
        where: { firebase_uid: req.user.firebase_uid },
        include: {
          enterprise: {
            include: {
              owner: {
                include: { wallet: true },
              },
            },
          },
          wallet: true,
        },
      });

      if (!user || user.role !== "ENTERPRISE_MEMBER" || !user.enterprise) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get enterprise owner's wallet
      const enterpriseWallet = await prisma.wallet.findUnique({
        where: { userId: user.enterprise.ownerId },
      });

      if (!enterpriseWallet) {
        return res.status(400).json({ error: "Enterprise wallet not found" });
      }

      // Check if enterprise has sufficient balance
      const bookingFee = 100; // Default fee - can be customized
      if (enterpriseWallet.balance < bookingFee) {
        return res.status(400).json({
          error: "Insufficient enterprise balance",
          required: bookingFee,
          current: enterpriseWallet.balance,
        });
      }

      // Deduct amount from enterprise wallet
      const updatedWallet = await prisma.wallet.update({
        where: { id: enterpriseWallet.id },
        data: {
          balance: enterpriseWallet.balance - bookingFee,
        },
      });

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          userId: parseInt(client_id),
          enterpriseMemberId: user.id,
          date: new Date(date),
          time_slot: time_slot,
          status: "CONFIRMED",
          is_paid: true,
          consultant_fee: bookingFee,
          commission_fee: bookingFee * 0.1,
          net_earning: bookingFee * 0.9,
        },
        include: {
          user: true,
          enterpriseMember: true,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: user.enterprise.ownerId,
          type: "DEBIT",
          amount: bookingFee,
          description: `Enterprise booking with client ID ${client_id}`,
          bookingId: booking.id,
          payment_method: "WALLET",
          status: "SUCCESS",
        },
      });

      console.log(
        `✓ Enterprise booking created: Member ${user.email} → Client ${client_id}`
      );
      res.status(201).json({
        ...booking,
        message: "Booking created successfully",
        remaining_balance: updatedWallet.balance,
      });
    } catch (error) {
      console.error("Create enterprise booking error:", error);
      res
        .status(500)
        .json({ error: "Failed to create booking: " + error.message });
    }
  }
);

/**
 * GET /enterprise/member/bookings
 * Get enterprise member's bookings
 */
/**
 * GET /enterprise/member/bookings
 * Get enterprise member's bookings
 */
app.get(
  "/enterprise/member/bookings",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      console.log("=".repeat(50));
      console.log("🔍 ENTERPRISE MEMBER BOOKINGS DEBUG");
      console.log("=".repeat(50));

      // Log the user from token
      console.log("📋 User from token:", {
        firebase_uid: req.user.firebase_uid,
        email: req.user.email,
        id: req.user.id,
        role: req.user.role,
      });

      // Find the user in database
      const user = await prisma.user.findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      });

      console.log("📋 Database user:", {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        enterpriseId: user?.enterpriseId,
      });

      if (!user) {
        console.log("❌ User not found in database");
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "ENTERPRISE_MEMBER" && user.role !== "ENTERPRISE_ADMIN") {
        console.log(`❌ Wrong role: ${user.role}, expected ENTERPRISE_MEMBER or ENTERPRISE_ADMIN`);
        return res.status(403).json({
          error: "Not authorized - wrong role",
          userRole: user.role,
        });
      }

      // Check if user has enterpriseId
      if (!user.enterpriseId) {
        console.log("❌ User has no enterpriseId");

        // Return empty array instead of error - this is better UX
        console.log("📚 Returning empty bookings array");
        return res.json([]);
      }

      // Fetch bookings
      console.log(`📚 Fetching bookings for enterprise member ID: ${user.id}`);

      const bookings = await prisma.booking.findMany({
        where: {
          enterpriseMemberId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              profile: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });

      console.log(`✅ Found ${bookings.length} bookings`);

      if (bookings.length > 0) {
        console.log("📋 First booking:", JSON.stringify(bookings[0], null, 2));
      }

      console.log("=".repeat(50));
      res.json(bookings);
    } catch (error) {
      console.error("❌ ERROR in /enterprise/member/bookings:");
      console.error(error);
      console.error("=".repeat(50));

      res.status(500).json({
        error: "Failed to fetch bookings",
        message: error.message,
      });
    }
  }
);

/**
 * GET /enterprise/member/dashboard-stats
 * Get dashboard statistics for enterprise member
 */
app.get(
  "/enterprise/member/dashboard-stats",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { firebase_uid: req.user.firebase_uid },
      });

      if (!user || user.role !== "ENTERPRISE_MEMBER") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const totalBookings = await prisma.booking.count({
        where: { enterpriseMemberId: user.id },
      });

      const pendingBookings = await prisma.booking.count({
        where: {
          enterpriseMemberId: user.id,
          status: "PENDING",
        },
      });

      const completedSessions = await prisma.booking.count({
        where: {
          enterpriseMemberId: user.id,
          call_completed: true,
        },
      });

      const upcomingSessions = await prisma.booking.count({
        where: {
          enterpriseMemberId: user.id,
          date: { gte: new Date() },
          call_completed: false,
          status: "CONFIRMED",
        },
      });

      res.json({
        totalBookings,
        pendingBookings,
        completedSessions,
        upcomingSessions,
      });
    } catch (error) {
      console.error("Fetch member stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
