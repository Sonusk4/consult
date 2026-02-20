const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedCreditPackages() {
  try {
    console.log("🌱 Seeding credit packages...");

    // Clear existing packages
    await prisma.creditPackage.deleteMany();

    // Create credit packages
    const packages = [
      { amount: 500, bonus: 50 },    // ₹500 + ₹50 bonus
      { amount: 1000, bonus: 120 },  // ₹1000 + ₹120 bonus  
      { amount: 2000, bonus: 300 },  // ₹2000 + ₹300 bonus
      { amount: 5000, bonus: 800 }   // ₹5000 + ₹800 bonus
    ];

    for (const pkg of packages) {
      await prisma.creditPackage.create({
        data: pkg
      });
      console.log(`✓ Created package: ₹${pkg.amount} + ₹${pkg.bonus} bonus`);
    }

    console.log("✅ Credit packages seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding credit packages:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCreditPackages();
