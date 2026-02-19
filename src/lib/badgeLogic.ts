import { prisma } from "./prisma";
import { BADGE_CONFIGS } from "./badgeConfig";

export interface BadgeDefinition {
    id: string;
    check: (userId: string, context: any) => Promise<boolean>;
}

export const BADGES: Record<string, BadgeDefinition> = {
    first_step: {
        id: 'first_step',
        check: async (userId) => {
            const count = await prisma.message.count({ where: { userId } });
            return count >= 1;
        }
    },
    on_fire: {
        id: 'on_fire',
        check: async (userId) => {
            // Simple streak check for 3 consecutive days
            const posts = await prisma.message.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
                take: 10
            });
            if (posts.length < 3) return false;

            const days = new Set(posts.map(p => p.createdAt.toDateString()));
            return days.size >= 3;
        }
    },
    wanderer: {
        id: 'wanderer',
        check: async (userId) => {
            // This is a placeholder as we don't store city names directly in Message yet
            // We could use reverse geocoding or just unique coordinate clusters
            return false;
        }
    },
    mayor: {
        id: 'mayor',
        check: async (userId) => {
            // Simplified check: if any 0.005 lat/lng area has 10 posts
            const messages = await prisma.message.findMany({ where: { userId } });
            const clusters: Record<string, number> = {};
            messages.forEach(m => {
                const key = `${m.latitude.toFixed(3)},${m.longitude.toFixed(3)}`;
                clusters[key] = (clusters[key] || 0) + 1;
            });
            return Object.values(clusters).some(count => count >= 10);
        }
    },
    social: {
        id: 'social',
        check: async (userId) => {
            const result = await prisma.message.aggregate({
                where: { userId },
                _sum: { likes: true }
            });
            return (result._sum.likes || 0) >= 50;
        }
    },
    night_owl: {
        id: 'night_owl',
        check: async (userId) => {
            const messages = await prisma.message.findMany({ where: { userId } });
            const nightPosts = messages.filter(m => {
                const hour = m.createdAt.getHours();
                return hour >= 0 && hour <= 5;
            });
            return nightPosts.length >= 5;
        }
    },
    legend: {
        id: 'legend',
        check: async (userId) => {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            return (user?.level || 1) >= 10;
        }
    }
};

export async function checkAndGrantBadges(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { badges: true }
    });

    if (!user) return [];

    const currentBadgeIds = new Set(user.badges.map(b => b.badgeId));
    const newlyEarned: string[] = [];

    for (const badge of Object.values(BADGES)) {
        if (currentBadgeIds.has(badge.id)) continue;

        const earned = await badge.check(userId, {});
        if (earned) {
            await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: badge.id
                }
            });
            newlyEarned.push(badge.id);
        }
    }

    return newlyEarned;
}

export async function seedBadges() {
    for (const badge of Object.values(BADGE_CONFIGS)) {
        await prisma.badge.upsert({
            where: { id: badge.id },
            update: {
                name: badge.nameKey,
                description: badge.descKey,
                style: badge.style
            },
            create: {
                id: badge.id,
                name: badge.nameKey,
                description: badge.descKey,
                style: badge.style
            }
        });
    }
}
