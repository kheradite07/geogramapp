import { prisma } from "@/lib/prisma";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function sendNotificationToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    try {
        const tokens = await prisma.pushToken.findMany({
            where: { userId },
            select: { token: true }
        });

        if (tokens.length === 0) return;

        const message = {
            notification: {
                title,
                body,
            },
            data,
            tokens: tokens.map(t => t.token),
        };

        const response = await firebaseAdmin.messaging().sendEachForMulticast(message);

        // Optional: Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx].token);
                }
            });

            if (failedTokens.length > 0) {
                await prisma.pushToken.deleteMany({
                    where: { token: { in: failedTokens } }
                });
            }
        }

        console.log(`Successfully sent message to ${response.successCount} devices.`);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
