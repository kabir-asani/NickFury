import { firestore } from "firebase-admin";
import { Either, Empty, failure, success } from "../../utils/typescriptx/typescriptx";
import { Firebase } from "../firebase/firebase";
import { DatabaseDeleteAllFailure, DatabaseDeleteAllSuccess, DatabaseDeleteFailure, DatabaseDeleteFailureReason, DatabaseDeleteSuccess, DatabaseWriteFailure, DatabaseWriteFailureReason, DatabaseWriteSuccess, ReadAllQueryOperator, DeleteAllQueryOperator, DatabaseDeleteAllFailureReason } from "./types";

export class Database {
    private static _shared = new Database();
    public static shared = (): Database => this._shared;

    private db = firestore(Firebase.shared().app());

    async exists(parameters: {
        collection: String,
        document: String
    }): Promise<Boolean> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const documentRef = collectionRef.doc(parameters.document.valueOf());

        const doc = await documentRef.get();

        return doc.exists;
    }

    async existsAny(parameters: {
        collection: String,
        where: {
            operandOne: String,
            operator: ReadAllQueryOperator,
            operandTwo: String,
        },
    }): Promise<Boolean> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());

        const query = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo
        );

        const querySnapshot = await query.get();

        return querySnapshot.empty;
    }

    async write<T>(parameters: {
        collection: String,
        document: String,
        data: T,
        overwrite?: Boolean
    }): Promise<Either<DatabaseWriteSuccess, DatabaseWriteFailure>> {
        // Check if we can create or overwrite this document
        const isWriteable = await (async () => {
            const isDocumentExisting = await this.exists({
                collection: parameters.collection,
                document: parameters.document!,
            });

            if (isDocumentExisting) {
                return parameters.overwrite || false;
            } else {
                return true;
            }
        })();

        if (isWriteable) {
            try {
                const collectionRef = this.db.collection(parameters.collection.valueOf());
                const documentRef = collectionRef.doc(parameters.document!.valueOf());

                await documentRef.set(parameters.data);

                return success({
                    id: parameters.document,
                });
            } catch {
                return failure({
                    reason: DatabaseWriteFailureReason.unknown
                });
            }
        } else {
            return failure({
                reason: DatabaseWriteFailureReason.documentCannotBeOverwritten
            });
        }
    }

    async read<T>(parameters: {
        collection: String,
        document: String
    }): Promise<T | null> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const documentRef = collectionRef.doc(parameters.document.valueOf());

        const document = await documentRef.get();

        if (document.exists) {
            const documentData = document.data as unknown as T;

            return documentData;
        } else {
            return null;
        }
    }

    async readAll<T>(parameters: {
        collection: String,
        where: {
            operandOne: String,
            operator: ReadAllQueryOperator,
            operandTwo: String,
        }
    }): Promise<T[] | null> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const queryRef = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo
        );

        const querySnapshot = await queryRef.get();
        const documents = querySnapshot.docs;
        const documentsData = documents.map((doc) => doc.data as unknown as T);

        if (documentsData.length > 0) {
            return documentsData;
        } else {
            return null;
        }
    }

    async delete(parameters: {
        collection: String,
        document: String,
    }): Promise<Either<DatabaseDeleteSuccess, DatabaseDeleteFailure>> {
        const isDocumentExisting = await this.exists({
            collection: parameters.collection,
            document: parameters.document,
        });

        if (isDocumentExisting) {
            try {
                const collectionRef = this.db.collection(parameters.collection.valueOf());
                const documentRef = collectionRef.doc(parameters.document.valueOf());

                await documentRef.delete();

                return success({});
            } catch {
                return failure({
                    reason: DatabaseDeleteFailureReason.unknown
                });
            }
        } else {
            return failure({
                reason: DatabaseDeleteFailureReason.documentNotFound
            });
        }
    }

    async deleteAll(parameters: {
        collection: String,
        where: {
            operandOne: String,
            operator: DeleteAllQueryOperator,
            operandTwo: String,
        }
    }): Promise<Either<DatabaseDeleteAllSuccess, DatabaseDeleteAllFailure>> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());

        const queryRef = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo
        );

        const querySnapshot = await queryRef.get();
        const documents = querySnapshot.docs;

        for (const document of documents) {
            await document.ref.delete();
        }

        return success({});
    }
}