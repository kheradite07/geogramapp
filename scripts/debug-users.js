const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            accounts: true
        }
    });
    console.log("Total Users:", users.length);
    users.forEach(u => {
        console.log(`User: ${u.id} | Email: ${u.email} | Name: ${u.name}`);
        u.accounts.forEach(a => {
            console.log(`  - Account: ${a.provider} (${a.providerAccountId})`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
