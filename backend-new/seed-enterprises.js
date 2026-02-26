const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedEnterprises() {
  try {
    console.log("🌱 Seeding enterprises...");

    // Create test enterprise owners
    const owners = [
      {
        email: "owner1@enterprise.com",
        name: "John Doe",
        phone: "+1-555-0001",
        role: "ENTERPRISE_ADMIN",
        password: "Password123!!"
      },
      {
        email: "owner2@enterprise.com",
        name: "Jane Smith",
        phone: "+1-555-0002",
        role: "ENTERPRISE_ADMIN",
        password: "Password123!!"
      }
    ];

    const createdOwners = [];

    for (const owner of owners) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: owner.email }
      });

      if (existingUser) {
        console.log(`✓ User already exists: ${owner.email}`);
        createdOwners.push(existingUser);
        continue;
      }

      const hashedPassword = await bcrypt.hash(owner.password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: owner.email,
          name: owner.name,
          phone: owner.phone,
          role: owner.role,
          firebase_uid: uuidv4(),
          permanent_password: hashedPassword,
          is_verified: true,
        }
      });
      console.log(`✓ Created user: ${owner.email} (ID: ${newUser.id})`);
      createdOwners.push(newUser);
    }

    // Create enterprises
    const enterprises = [
      {
        name: "Tech Consultancy Inc",
        registration_no: "REG001234",
        gst_number: "18AABCT1234H1Z0",
        website: "https://techconsult.com",
        description: "Leading IT consulting and software development firm",
        ownerId: createdOwners[0].id,
        priority: "HIGH",
        status: "ACTIVE"
      },
      {
        name: "Digital Solutions Ltd",
        registration_no: "REG005678",
        gst_number: "27AABCU5678K2Z5",
        website: "https://digitalsolutions.com",
        description: "Digital transformation and cloud consulting services",
        ownerId: createdOwners[1].id,
        priority: "MEDIUM",
        status: "ACTIVE"
      }
    ];

    for (const enterprise of enterprises) {
      // Check if enterprise already exists
      const existingEnterprise = await prisma.enterprise.findUnique({
        where: { ownerId: enterprise.ownerId }
      });

      if (existingEnterprise) {
        console.log(`✓ Enterprise already exists for owner ID ${enterprise.ownerId}`);
        continue;
      }

      const newEnterprise = await prisma.enterprise.create({
        data: enterprise
      });
      console.log(`✓ Created enterprise: ${enterprise.name} (ID: ${newEnterprise.id})`);
    }

    console.log("✅ Enterprises seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding enterprises:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedEnterprises();
}

module.exports = { seedEnterprises };
