import admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import firebaseSecrets from '../../firebase.json';

export class Firebase {
    private static _shared = new Firebase();
    public static shared = () => this._shared;

    private _app: App;
    public app = (): App => this._app;

    constructor() {
        const serviceAccount = {
            projectId: firebaseSecrets.project_id,
            clientEmail: firebaseSecrets.client_email,
            privateKey: firebaseSecrets.private_key
        };

        this._app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}