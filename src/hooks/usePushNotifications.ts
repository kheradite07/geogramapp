"use client";

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useSession } from 'next-auth/react';

export function usePushNotifications() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        // Only attempt to register if authenticated
        if (status !== 'authenticated') {
            console.log('PushNotifications: Waiting for authentication before registering...');
            return;
        }

        console.log('PushNotifications: User authenticated, initiating registration sequence...');

        const registerPushNotifications = async () => {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('User denied permissions!');
                return;
            }

            await PushNotifications.register();

            // Create high-priority channel
            await PushNotifications.createChannel({
                id: 'pop-notifications',
                name: 'Pop Notifications',
                description: 'Notifications that pop up on screen',
                importance: 5,
                visibility: 1,
                vibration: true,
            });
        };

        const addListeners = async () => {
            await PushNotifications.addListener('registration', async token => {
                console.info('Registration token: ', token.value);
                // Send token to backend
                try {
                    await fetch('/api/users/push-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: token.value,
                            platform: Capacitor.getPlatform(),
                        }),
                    });
                } catch (e) {
                    console.error('Failed to send push token to server', e);
                }
            });

            await PushNotifications.addListener('registrationError', err => {
                console.error('Registration error: ', err.error);
            });

            await PushNotifications.addListener('pushNotificationReceived', notification => {
                console.log('Push notification received: ', notification);
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                console.log('Push notification action performed', notification.actionId, notification.inputValue);
            });
        };

        registerPushNotifications();
        addListeners();

        // Cleanup listeners not strictly necessary as they are global, 
        // but good practice if we were mounting/unmounting frequently.
        // However, PushNotifications.removeAllListeners() removes ALL, checking context is important.
        // For a top-level hook, we might just leave them or handle cleanup carefully.

    }, [status]);
}
