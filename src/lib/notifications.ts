import { prisma } from "@/lib/prisma";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function sendNotificationToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    try {
        console.log(`Attempting to send notification to user: ${userId}`);
        const tokens = await prisma.pushToken.findMany({
            where: { userId },
            select: { token: true }
        });

        if (tokens.length === 0) {
            console.log(`No push tokens found for user: ${userId}`);
            return;
        }

        console.log(`Found ${tokens.length} tokens for user: ${userId}`);

        const message = {
            notification: {
                title,
                body,
            },
            android: {
                priority: "high" as "high", // 'high' is treated as MAX priority by FCM for Android
                notification: {
                    channelId: "pop-notifications",
                    priority: "high" as "high", // deprecated but good fallback
                    defaultSound: true,
                    defaultVibrateTimings: true
                }
            },
            data,
            tokens: tokens.map(t => t.token),
        };

        const response = await firebaseAdmin.messaging().sendEachForMulticast(message);

        console.log(`FCM Multicast response: success=${response.successCount}, failure=${response.failureCount}`);

        // Optional: Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                    console.warn(`Token failed: ${tokens[idx].token}. Error:`, resp.error);
                    failedTokens.push(tokens[idx].token);
                }
            });

            if (failedTokens.length > 0) {
                console.log(`Cleaning up ${failedTokens.length} failed tokens...`);
                await prisma.pushToken.deleteMany({
                    where: { token: { in: failedTokens } }
                });
            }
        }

        console.log(`Successfully sent message to ${response.successCount} devices.`);
    } catch (error) {
        console.error('CRITICAL: Error sending notification:', error);
    }
}
