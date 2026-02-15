const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'msenel.contact@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
    });

    if (!user) {
        console.log(`User not found for email: ${email}`);
        return;
    }

    console.log(`Found user: ${user.id} with ${user.accounts.length} linked accounts.`);

    // Delete all accounts for this user
    // This forces re-linking on next login based on email match
    if (user.accounts.length > 0) {
        const deleteResult = await prisma.account.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${deleteResult.count} account links.`);
        console.log("Please ask the user to Sign Out and Sign In again.");
    } else {
        console.log("No accounts to delete.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
