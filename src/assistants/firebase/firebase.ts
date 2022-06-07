import admin from "firebase-admin";
import { App } from "firebase-admin/app";
import { exit } from "process";

export default class FirebaseAssistant {
    static readonly shared = new FirebaseAssistant();

    readonly app: App;

    private constructor() {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID || exit(),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || exit(),
            privateKey: process.env.FIREBASE_PRIVATE_KEY || exit(),
        };

        this.app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}
