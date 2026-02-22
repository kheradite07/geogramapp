import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            console.error('Firebase Admin Error: Missing required environment variables.', {
                projectId: !!projectId,
                clientEmail: !!clientEmail,
                privateKey: !!privateKey
            });
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    // Replace escaped newlines if they exist in the env var
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin initialized successfully.');
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const firebaseAdmin = admin;
