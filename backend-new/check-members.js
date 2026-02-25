const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMembers() {
  try {
    const members = await prisma.user.findMany({
      where: { role: 'ENTERPRISE_MEMBER' },
      select: {
        id: true,
        email: true,
        name: true,
        is_verified: true,
        temp_username: true,
        temp_password: true,
      },
    });
    
    console.log('=== Enterprise Members ===');
    console.log(JSON.stringify(members, null, 2));
    console.log('\n=== Login Credentials ===');
    members.forEach(member => {
      console.log(`Email: ${member.email}`);
      console.log(`Username: ${member.temp_username || 'NOT SET'}`);
      console.log(`Password: ${member.temp_password || 'NOT SET'}`);
      console.log(`Verified: ${member.is_verified ? 'YES' : 'NO'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembers();
