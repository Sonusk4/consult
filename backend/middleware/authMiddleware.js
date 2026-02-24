const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");

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

    console.log("🔑 Verifying Firebase token...");

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log("✅ Token verified for UID:", decodedToken.uid);
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const firebase_uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: "Email not found in token" });
    }

    // Find user in database by firebase_uid
    let user = await prisma.user.findUnique({
      where: { firebase_uid },
      include: { consultant: true },
    });

    // If not found by firebase_uid, try to find by email and link
    if (!user) {
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
