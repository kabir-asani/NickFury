import admin from "firebase-admin";
import { App } from "firebase-admin/app";
import Secrets from "../../secrets.json";

export default class FirebaseAssistant {
    static readonly shared = new FirebaseAssistant();

    readonly app: App;

    private constructor() {
        const serviceAccount = {
            projectId:
                process.env.FIREBASE_PROJECT_ID || Secrets.firebase.projectId,
            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL ||
                Secrets.firebase.clientEmail,
            privateKey:
                process.env.FIREBASE_PRIVATE_KEY || Secrets.firebase.privateKey,
        };

        this.app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}
