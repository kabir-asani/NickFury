import { firestore } from "firebase-admin";
import { FirebaseAssistant } from "../firebase/firebase";

export class DatabaseAssistant {
    public static readonly shared = firestore(FirebaseAssistant.shared().app());
}