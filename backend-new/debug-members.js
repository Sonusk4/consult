const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking enterprise members in database...\n");

  const members = await prisma.user.findMany({
    where: { role: "ENTERPRISE_MEMBER" },
    select: {
      id: true,
      email: true,
      name: true,
      temp_username: true,
      temp_password: true,
      is_verified: true,
      invite_token: true,
      firebase_uid: true,
    },
  });

  if (members.length === 0) {
    console.log("❌ No enterprise members found in database");
  } else {
    console.log(`✅ Found ${members.length} enterprise member(s):\n`);
    members.forEach((member, idx) => {
      console.log(`  ${idx + 1}. ${member.name || "No name"}`);
      console.log(`     Email: ${member.email}`);
      console.log(`     Username: ${member.temp_username}`);
      console.log(`     Password: ${member.temp_password}`);
      console.log(`     Verified: ${member.is_verified}`);
      console.log(`     Invite Token: ${member.invite_token ? "Yes" : "No"}`);
      console.log("");
    });
  }

  console.log("\n📋 Checking all users...");
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  console.log(`Total users: ${allUsers.length}`);
  allUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.role})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
