import { firestore } from "firebase-admin";
import { Either, Empty, failure, success } from "../../utils/typescriptx/typescriptx";
import { Firebase } from "../firebase/firebase";
import { DatabaseDeleteFailureReason, DatabaseReadFailureReason, DatabaseWriteFailureReason } from "./types";

export class Database {
    private static instance = new Database();
    public static shared = (): Database => this.instance;

    private db = firestore(Firebase.shared().app());

    async exists(parameters: {
        collection: String,
        document: String
    }): Promise<Boolean> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const documentRef = collectionRef.doc(parameters.document.valueOf());

        const doc = await documentRef.get();

        return Promise.resolve(doc.exists);
    }

    async write(parameters: {
        collection: String,
        document?: String,
        data: Object,
        overwrite?: Boolean
    }): Promise<Either<{ identifier?: String }, DatabaseWriteFailureReason>> {
        const isDocumentIdProvided = parameters.document !== undefined;

        // Check if we can create or overwrite this document
        const isWriteable = await (async () => {
            if (isDocumentIdProvided) {
                const isDocumentExisting = await this.exists({
                    collection: parameters.collection,
                    document: parameters.document!,
                });

                if (isDocumentExisting) {
                    return parameters.overwrite || false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        })();

        if (isWriteable) {
            try {
                const collectionRef = this.db.collection(parameters.collection.valueOf());

                if (isDocumentIdProvided) {
                    const { id } = await collectionRef.add(parameters.data);

                    return Promise.resolve(success({ identifier: id }));
                } else {
                    const documentRef = collectionRef.doc(parameters.document!.valueOf());

                    await documentRef.set(parameters.data);

                    return Promise.resolve(success({}));
                }
            } catch (error) {
                return Promise.resolve(failure(DatabaseWriteFailureReason.unknown));
            }
        } else {
            return Promise.resolve(failure(DatabaseWriteFailureReason.documentCannotBeOverwritten));
        }
    }

    async read<T>(parameters: {
        collection: String,
        document: String
    }): Promise<Either<T, DatabaseReadFailureReason>> {
        const isDocumentExisting = await this.exists({
            collection: parameters.collection,
            document: parameters.document,
        });

        if (isDocumentExisting) {
            try {
                const collectionRef = this.db.collection(parameters.collection.valueOf());
                const documentRef = collectionRef.doc(parameters.document.valueOf());

                const document = await documentRef.get();
                const data = document.data;

                return Promise.resolve(success(data as unknown as T));
            } catch (error) {
                return Promise.resolve(failure(DatabaseReadFailureReason.unknown));
            }
        } else {
            return Promise.resolve(failure(DatabaseReadFailureReason.documentNotFound));
        }
    }

    async delete(parameters: {
        collection: String,
        document: String,
    }): Promise<Either<Empty, DatabaseDeleteFailureReason>> {
        const isDocumentExisting = await this.exists({
            collection: parameters.collection,
            document: parameters.document,
        });

        if (isDocumentExisting) {
            try {
                const collectionRef = this.db.collection(parameters.collection.valueOf());
                const documentRef = collectionRef.doc(parameters.document.valueOf());

                await documentRef.delete();

                return Promise.resolve(success({}));
            } catch (error) {
                return Promise.resolve(failure(DatabaseDeleteFailureReason.unknown));
            }
        } else {
            return Promise.resolve(failure(DatabaseDeleteFailureReason.documentNotFound));
        }
    }
}