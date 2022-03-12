import admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import Secrets from '../../secrets.json';

export class Firebase {
    private static _shared = new Firebase();
    public static shared = () => this._shared;

    private _app: App;
    public app = (): App => this._app;

    constructor() {
        const serviceAccount = {
            projectId: Secrets.firebase.projectId,
            clientEmail: Secrets.firebase.clientEmail,
            privateKey: Secrets.firebase.privateKey
        };

        this._app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}