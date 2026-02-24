
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const deleted = await prisma.user.deleteMany({
            where: {
                firebase_uid: { startsWith: 'test-uid-' }
            }
        });
        console.log(`Deleted ${deleted.count} temporary dev users.`);
    } catch (e) {
        console.error("Error cleaning up:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
