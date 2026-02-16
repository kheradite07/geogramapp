"use client";

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export function usePushNotifications() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

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

    }, []);
}
