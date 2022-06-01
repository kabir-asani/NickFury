import { firestore } from "firebase-admin";
import FirebaseAssistant from "../firebase/firebase";

export default class DatabaseAssistant {
    public static readonly shared = new DatabaseAssistant();

    private readonly firestore = firestore(FirebaseAssistant.shared.app);

    private readonly sessionsCollectionName = "sessions";

    private readonly tweetsCollectionName = "tweets";
    private readonly likesCollectionName = "likes";
    private readonly commentsCollectionName = "comments";

    private readonly usersCollectionName = "users";
    private readonly followeesCollectionName = "followees";
    private readonly followersCollectionName = "followers";
    private readonly bookmarksCollectionName = "bookmarks";

    all(
        ...documentRefsOrReadOptions: Array<
            | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
            | FirebaseFirestore.ReadOptions
        >
    ): Promise<
        Array<
            FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
        >
    > {
        return this.firestore.getAll(...documentRefsOrReadOptions);
    }

    transaction<T>(
        executor: (transaction: FirebaseFirestore.Transaction) => Promise<T>
    ): Promise<T> {
        return this.firestore.runTransaction(executor);
    }

    sessionsCollectionRef(parameters: {
        userId: String;
    }): FirebaseFirestore.CollectionReference {
        const sessionCollectionPath =
            this.usersCollectionName +
            `/${parameters.userId}/` +
            this.sessionsCollectionName;

        const collection = this.firestore.collection(sessionCollectionPath);

        return collection;
    }

    sessionDocumentRef(parameters: {
        userId: String;
        sessionId: String;
    }): FirebaseFirestore.DocumentReference {
        const sessionsCollectionRef = this.sessionsCollectionRef({
            userId: parameters.userId,
        });

        const sessionDocumentRef = sessionsCollectionRef.doc(
            parameters.sessionId.valueOf()
        );

        return sessionDocumentRef;
    }

    tweetsCollectionRef(): FirebaseFirestore.CollectionReference {
        const tweetsCollectionRef = this.firestore.collection(
            this.tweetsCollectionName
        );

        return tweetsCollectionRef;
    }

    tweetDocumentRef(parameters: {
        tweetId: String;
    }): FirebaseFirestore.DocumentReference {
        const tweetsCollectionRef = this.tweetsCollectionRef();

        const tweetDocumentRef = tweetsCollectionRef.doc(
            parameters.tweetId.valueOf()
        );

        return tweetDocumentRef;
    }

    likesCollectionRef(parameters: {
        tweetId: String;
    }): FirebaseFirestore.CollectionReference {
        const tweetDocumentRef = this.tweetDocumentRef({
            tweetId: parameters.tweetId,
        });

        const likesCollectionRef = tweetDocumentRef.collection(
            this.likesCollectionName.valueOf()
        );

        return likesCollectionRef;
    }

    likesCollectionGroupRef(): FirebaseFirestore.CollectionGroup {
        const likesCollectionGroupRef = this.firestore.collectionGroup(
            this.likesCollectionName
        );

        return likesCollectionGroupRef;
    }

    likeDocumentRef(parameters: {
        tweetId: String;
        likeId: String;
    }): FirebaseFirestore.DocumentReference {
        const likesCollectionRef = this.likesCollectionRef({
            tweetId: parameters.tweetId,
        });

        const likeDocumentRef = likesCollectionRef.doc(
            parameters.likeId.valueOf()
        );

        return likeDocumentRef;
    }

    commentsCollectionRef(parameters: {
        tweetId: String;
    }): FirebaseFirestore.CollectionReference {
        const tweetDocumentRef = this.tweetDocumentRef({
            tweetId: parameters.tweetId,
        });

        const commentsCollectionRef = tweetDocumentRef.collection(
            this.commentsCollectionName.valueOf()
        );

        return commentsCollectionRef;
    }

    commentsCollectionGroupRef(): FirebaseFirestore.CollectionGroup {
        const commentsCollectionGroupRef = this.firestore.collectionGroup(
            this.commentsCollectionName
        );

        return commentsCollectionGroupRef;
    }

    commentDocumentRef(parameters: {
        tweetId: String;
        commentId: String;
    }): FirebaseFirestore.DocumentReference {
        const commentsCollectionRef = this.commentsCollectionRef({
            tweetId: parameters.tweetId,
        });

        const commentDocumentRef = commentsCollectionRef.doc(
            parameters.commentId.valueOf()
        );

        return commentDocumentRef;
    }

    usersCollectionRef(): FirebaseFirestore.CollectionReference {
        const usersCollectionRef = this.firestore.collection(
            this.usersCollectionName
        );

        return usersCollectionRef;
    }

    userDocumentRef(parameters: {
        userId: String;
    }): FirebaseFirestore.DocumentReference {
        const usersCollectionRef = this.usersCollectionRef();

        const userDocumentRef = usersCollectionRef.doc(
            parameters.userId.valueOf()
        );

        return userDocumentRef;
    }

    followeesCollectionRef(parameters: {
        userId: String;
    }): FirebaseFirestore.CollectionReference {
        const userDocumentRef = this.userDocumentRef({
            userId: parameters.userId,
        });

        const followeesCollectionRef = userDocumentRef.collection(
            this.followeesCollectionName
        );

        return followeesCollectionRef;
    }

    followeesCollectionGroupRef(): FirebaseFirestore.CollectionGroup {
        const followeesCollectionGroupRef = this.firestore.collectionGroup(
            this.followeesCollectionName
        );

        return followeesCollectionGroupRef;
    }

    followeeDocumentRef(parameters: {
        userId: String;
        followeeId: String;
    }): FirebaseFirestore.DocumentReference {
        const followeesCollectionRef = this.followeesCollectionRef({
            userId: parameters.userId,
        });

        const followeeDocumentRef = followeesCollectionRef.doc(
            parameters.followeeId.valueOf()
        );

        return followeeDocumentRef;
    }

    followersCollectionRef(parameters: {
        userId: String;
    }): FirebaseFirestore.CollectionReference {
        const userDocumentRef = this.userDocumentRef({
            userId: parameters.userId,
        });

        const followersCollectionRef = userDocumentRef.collection(
            this.followersCollectionName
        );

        return followersCollectionRef;
    }

    followersCollectionGroupRef(): FirebaseFirestore.CollectionGroup {
        const followersCollectionGroupRef = this.firestore.collectionGroup(
            this.followersCollectionName
        );

        return followersCollectionGroupRef;
    }

    followerDocumentRef(parameters: {
        userId: String;
        followerId: String;
    }): FirebaseFirestore.DocumentReference {
        const followersCollectionRef = this.followersCollectionRef({
            userId: parameters.userId,
        });

        const followerDocumentRef = followersCollectionRef.doc(
            parameters.followerId.valueOf()
        );

        return followerDocumentRef;
    }

    bookmarksCollectionRef(parameters: {
        userId: String;
    }): FirebaseFirestore.CollectionReference {
        const userDocumentRef = this.userDocumentRef({
            userId: parameters.userId,
        });

        const bookmarksCollectionRef = userDocumentRef.collection(
            this.bookmarksCollectionName
        );

        return bookmarksCollectionRef;
    }

    bookmarksCollectionGroupRef(): FirebaseFirestore.CollectionGroup {
        const bookmarksCollectionGroupRef = this.firestore.collectionGroup(
            this.bookmarksCollectionName
        );

        return bookmarksCollectionGroupRef;
    }

    bookmarkDocumenRef(parameters: {
        userId: String;
        bookmarkId: String;
    }): FirebaseFirestore.DocumentReference {
        const bookmarksCollectionRef = this.bookmarksCollectionRef({
            userId: parameters.userId,
        });

        const bookmarkDocumenRef = bookmarksCollectionRef.doc(
            parameters.bookmarkId.valueOf()
        );

        return bookmarkDocumenRef;
    }

    private constructor() {}
}
