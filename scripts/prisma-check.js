require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      select: { id: true, email: true },
    });

    console.log('prisma-check ok', user ? user.email : 'no-user');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});