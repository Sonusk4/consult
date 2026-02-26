/**
 * clear-db.js
 * Deletes ALL records from every table in the correct dependency order.
 * Run with: node clear-db.js
 */
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function clearDatabase() {
    console.log("⚠️  Starting full database clear...\n");

    try {
        // Delete in dependency order (children before parents)

        console.log("🗑️  Deleting EnterpriseInvites...");
        await prisma.enterpriseInvite.deleteMany({});

        console.log("🗑️  Deleting Reviews...");
        await prisma.review.deleteMany({});

        console.log("🗑️  Deleting SupportTickets...");
        await prisma.supportTicket.deleteMany({});

        console.log("🗑️  Deleting Messages...");
        await prisma.message.deleteMany({});

        console.log("🗑️  Deleting Payments...");
        await prisma.payment.deleteMany({});

        console.log("🗑️  Deleting Bookings...");
        await prisma.booking.deleteMany({});

        console.log("🗑️  Deleting Availability...");
        await prisma.availability.deleteMany({});

        console.log("🗑️  Deleting Slots...");
        await prisma.slot.deleteMany({});

        console.log("🗑️  Deleting Consultants...");
        await prisma.consultant.deleteMany({});

        console.log("🗑️  Deleting Transactions...");
        await prisma.transaction.deleteMany({});

        console.log("🗑️  Deleting PaymentOrders...");
        await prisma.paymentOrder.deleteMany({});

        console.log("🗑️  Deleting Wallets...");
        await prisma.wallet.deleteMany({});

        console.log("🗑️  Deleting UserProfiles...");
        await prisma.userProfile.deleteMany({});

        console.log("🗑️  Deleting Enterprises...");
        await prisma.enterprise.deleteMany({});

        console.log("🗑️  Deleting Users...");
        await prisma.user.deleteMany({});

        console.log("🗑️  Deleting CreditPackages...");
        await prisma.creditPackage.deleteMany({});

        console.log("\n✅ All data deleted successfully!");
        console.log("The database is now empty and ready for fresh data.");
    } catch (error) {
        console.error("\n❌ Error clearing database:", error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
