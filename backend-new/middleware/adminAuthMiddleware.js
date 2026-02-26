/**
 * adminAuthMiddleware.js
 * JWT-based middleware for the admin portal (separate from Firebase user auth).
 */
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "admin-secret-key";

const verifyAdminToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No admin token provided" });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired admin token" });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: decoded.adminId },
        });

        if (!admin) {
            return res.status(401).json({ error: "Admin not found" });
        }

        req.admin = admin;
        next();
    } catch (err) {
        console.error("Admin Auth Middleware Error:", err.message);
        res.status(500).json({ error: "Admin authentication failed" });
    }
};

module.exports = verifyAdminToken;
