const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedCreditPackages() {
  try {
    console.log("🌱 Seeding credit packages...");

    // Clear existing packages
    await prisma.creditPackage.deleteMany();

    // Create credit packages
    const packages = [
      { amount: 500, bonus: 10 },
      { amount: 1000, bonus: 25 },
      { amount: 2000, bonus: 100 },
      { amount: 5000, bonus: 350 }
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
