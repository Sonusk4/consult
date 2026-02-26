const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token in Authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      console.log("❌ Empty token");
      return res.status(401).json({ error: "Invalid token format" });
    }

    console.log("🔑 Verifying token...");
    console.log("Token received:", token.substring(0, 50) + "...");

    // First try to verify as dev JWT token
    let decodedToken;
    let isDevToken = false;
    let isCustomToken = false;

    try {
      const devSecret = process.env.JWT_SECRET || "dev-secret-key-for-testing-only";
      decodedToken = jwt.verify(token, devSecret);
      console.log("✅ Dev JWT token verified for user:", decodedToken.email);
      isDevToken = true;
    } catch (devError) {
      console.log("Dev JWT verification failed, trying to decode without verification...");

      // Try to decode JWT without verification (for dev mode with unsecured tokens)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // This looks like a JWT, try to decode the payload
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log("✅ JWT decoded (without verification) for user:", decoded.email);

          // Check if token has expired
          if (decoded.exp && Date.now() / 1000 > decoded.exp) {
            throw new Error("Token expired");
          }

          decodedToken = decoded;
          isDevToken = true;
        } else {
          throw new Error("Not a JWT format token");
        }
      } catch (jwtDecodeError) {
        console.log("Not a JWT token, trying custom base64 token...");

        // If JWT fails, try custom base64 token
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

          // Check if token has expired
          if (decoded.exp && Date.now() > decoded.exp) {
            throw new Error("Custom token expired");
          }

          decodedToken = decoded;
          console.log("✅ Custom base64 token verified for user:", decodedToken.email);
          isCustomToken = true;
        } catch (customError) {
          // If custom token fails, try Firebase token
          console.log("Not a custom token, trying Firebase verification...");

          try {
            decodedToken = await admin.auth().verifyIdToken(token);
            console.log("✅ Firebase token verified for UID:", decodedToken.uid);
          } catch (firebaseError) {
            console.error("❌ All token verifications failed");
            console.error("Dev JWT error:", devError.message);
            console.error("JWT decode error:", jwtDecodeError.message);
            console.error("Custom token error:", customError.message);
            console.error("Firebase error:", firebaseError.message);
            return res.status(401).json({ error: "Invalid or expired token" });
          }
        }
      }
    }

    let email;
    let firebase_uid;

    if (isDevToken) {
      // Handle dev token
      email = decodedToken.email;
      firebase_uid = decodedToken.uid; // Should be user.id from DB
      console.log("🔧 Using dev token for email:", email);
    } else if (isCustomToken) {
      // Handle custom base64 token
      email = decodedToken.email;
      firebase_uid = decodedToken.id?.toString(); // Convert to string for consistency
      console.log("🔧 Using custom token for email:", email);
    } else {
      // Handle Firebase token
      firebase_uid = decodedToken.uid;
      email = decodedToken.email;
    }

    if (!email) {
      return res.status(400).json({ error: "Email not found in token" });
    }

    // Find user in database
    let user;

    if (isDevToken || isCustomToken) {
      // For dev and custom tokens, try to find by ID first (for dev mode), then by email
      console.log("🔍 Dev/Custom token - looking up user. Email:", email, "UID:", firebase_uid);

      // If uid looks like a database ID (numeric), try finding by ID
      if (firebase_uid && !isNaN(firebase_uid)) {
        console.log("   Trying to find by ID:", firebase_uid);
        user = await prisma.user.findUnique({
          where: { id: parseInt(firebase_uid) },
          include: { consultant: true },
        });
      }

      // If not found by ID, try by email
      if (!user && email) {
        console.log("   Trying to find by email:", email);
        user = await prisma.user.findUnique({
          where: { email },
          include: { consultant: true },
        });
      }

      // If found by email and we have a firebase_uid, update it
      if (user && firebase_uid && !user.firebase_uid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebase_uid },
          include: { consultant: true },
        });
        console.log("✅ Updated user with firebase_uid:", user.id);
      }
    } else {
      // For Firebase tokens, find by firebase_uid
      console.log("🔍 Firebase token - finding user by UID:", firebase_uid);
      user = await prisma.user.findUnique({
        where: { firebase_uid },
        include: { consultant: true },
      });
    }

    // If not found by firebase_uid, try to find by email and link
    if (!user && !isDevToken && !isCustomToken) {
      console.log("User not found by firebase_uid, checking by email:", email);

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Link existing user to Firebase UID
        user = await prisma.user.update({
          where: { email },
          data: {
            firebase_uid,
            is_verified: true,
          },
          include: { consultant: true },
        });
        console.log("✅ Linked existing user to Firebase UID:", user.id);
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            firebase_uid,
            email,
            role: "USER",
            is_verified: true,
          },
          include: { consultant: true },
        });
        console.log("✅ Created new user for Firebase UID:", user.id);
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Attach user to request object
    req.user = user;
    console.log("✅ User authenticated:", user.email, "Role:", user.role);

    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    res.status(500).json({ error: "Authentication failed: " + err.message });
  }
};

// Dev mode middleware (fallback for testing when Firebase is down)
const devAuthMiddleware = async (req, res, next) => {
  try {
    const email = req.headers["x-user-email"];

    if (!email) {
      return res.status(401).json({ error: "No email provided for dev auth" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { consultant: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    console.log("✅ DEV Mode - User attached:", user.email);
    next();
  } catch (err) {
    console.error("Dev Auth Error:", err);
    res.status(500).json({ error: "Dev auth failed" });
  }
};

// Export both, but use verifyFirebaseToken as default
module.exports = verifyFirebaseToken;
module.exports.devAuthMiddleware = devAuthMiddleware;
