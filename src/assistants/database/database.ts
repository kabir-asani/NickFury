import { firestore } from "firebase-admin";
import { FirebaseAssistant } from "../firebase/firebase";

export class DBCollections {
    static readonly sessions = "sessions";

    static readonly tweets = "tweets";
    static readonly likes = "likes";
    static readonly comments = "comments";

    static readonly users = "users";
    static readonly followings = "followings";
    static readonly followers = "followers";
    static readonly bookmarks = "bookmarks";
}

export class DatabaseAssistant {
    public static readonly shared = firestore(FirebaseAssistant.shared().app());

    private constructor() { }
}