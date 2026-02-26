const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helper functions from the invite endpoint
function generateUsername() {
  const adjectives = ["swift", "bright", "clever", "sharp", "wise", "kind", "bold", "quick"];
  const nouns = ["eagle", "fox", "wolf", "hawk", "tiger", "lion", "bear", "panther"];
  const number = Math.floor(Math.random() * 1000);
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}${number}`;
}

function generatePassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function main() {
  console.log("🔧 Fixing enterprise members with NULL credentials...\n");

  // Find all enterprise members with NULL credentials
  const membersToFix = await prisma.user.findMany({
    where: {
      role: "ENTERPRISE_MEMBER",
      OR: [
        { temp_username: null },
        { temp_password: null },
      ],
    },
  });

  if (membersToFix.length === 0) {
    console.log("✅ No members need fixing - all have credentials!");
    return;
  }

  console.log(`Found ${membersToFix.length} member(s) with missing credentials:\n`);

  for (const member of membersToFix) {
    const username = member.temp_username || generateUsername();
    const password = member.temp_password || generatePassword();

    console.log(`Fixing member: ${member.email}`);
    console.log(`  Current username: ${member.temp_username}`);
    console.log(`  Current password: ${member.temp_password}`);
    console.log(`  New username: ${username}`);
    console.log(`  New password: ${password}`);

    await prisma.user.update({
      where: { id: member.id },
      data: {
        temp_username: username,
        temp_password: password,
      },
    });

    console.log(`✅ Fixed: ${member.email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log("");
  }

  console.log("\n✅ All members fixed!");
  console.log("\n📋 Updated member list:");
  
  const updatedMembers = await prisma.user.findMany({
    where: { role: "ENTERPRISE_MEMBER" },
    select: {
      email: true,
      name: true,
      temp_username: true,
      temp_password: true,
      is_verified: true,
    },
  });

  updatedMembers.forEach((member, idx) => {
    console.log(`\n${idx + 1}. ${member.name || "No name"}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Username: ${member.temp_username}`);
    console.log(`   Password: ${member.temp_password}`);
    console.log(`   Is Verified: ${member.is_verified}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
