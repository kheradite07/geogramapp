import { seedBadges } from "./src/lib/badgeLogic";

async function main() {
    console.log("Seeding badges...");
    await seedBadges();
    console.log("Badges seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
