const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("❌ Full error:", error);
  }
}

testConnection();
