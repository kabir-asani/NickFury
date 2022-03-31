import admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import Secrets from '../../secrets.json';

export class FirebaseAssistant {
    private static _shared = new FirebaseAssistant();
    public static shared = () => this._shared;

    private _app: App;
    public app = (): App => this._app;

    constructor() {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID || Secrets.firebase.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || Secrets.firebase.clientEmail,
            privateKey: process.env.FIREBASE_PRIVATE_KEY || Secrets.firebase.privateKey,
        };

        this._app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}