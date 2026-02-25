const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestMember() {
  try {
    // Find or create a test enterprise member
    let member = await prisma.user.findFirst({
      where: { email: 'test.member@company.com' },
    });

    if (member) {
      console.log('Member already exists, updating credentials...');
      member = await prisma.user.update({
        where: { id: member.id },
        data: {
          role: 'ENTERPRISE_MEMBER',
          temp_username: 'testmember',
          temp_password: 'Test@123',
          is_verified: true,
          name: 'Test Member',
        },
      });
    } else {
      console.log('Creating new test member...');
      member = await prisma.user.create({
        data: {
          email: 'test.member@company.com',
          firebase_uid: `temp_${Date.now()}`,
          role: 'ENTERPRISE_MEMBER',
          temp_username: 'testmember',
          temp_password: 'Test@123',
          is_verified: true,
          name: 'Test Member',
        },
      });
    }

    console.log('\n✅ Test member created successfully!');
    console.log('\n=== Login Credentials ===');
    console.log(`Username: ${member.temp_username}`);
    console.log(`Password: ${member.temp_password}`);
    console.log('\nYou can now test the team member login at:');
    console.log('http://localhost:3000/#/login');
    console.log('\nSelect "Enterprise Team Member" and use the credentials above.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestMember();
