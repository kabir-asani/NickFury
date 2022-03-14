import { firestore } from "firebase-admin";
import { Either, Empty, failure, success } from "../../utils/typescriptx/typescriptx";
import { Firebase } from "../firebase/firebase";
import { DatabaseDeleteFailure, DatabaseDeleteFailureReason, DatabaseDeleteSuccess, DatabaseReadFailure, DatabaseReadFailureReason, DatabaseReadSuccess, DatabaseWriteFailure, DatabaseWriteFailureReason, DatabaseWriteSuccess, ReadAllQueryOperator } from "./types";

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

        return Promise.resolve(doc.exists);
    }

    async write(parameters: {
        collection: String,
        document?: String,
        data: Object,
        overwrite?: Boolean
    }): Promise<Either<DatabaseWriteSuccess, DatabaseWriteFailure>> {
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

                    return success({
                        id: id
                    });
                } else {
                    const documentRef = collectionRef.doc(parameters.document!.valueOf());

                    await documentRef.set(parameters.data);

                    return success({
                        id: parameters.document,
                    });
                }
            } catch (error) {
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

    async read(parameters: {
        collection: String,
        document: String
    }): Promise<Either<DatabaseReadSuccess, DatabaseReadFailure>> {
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

                return success({
                    data: data
                });
            } catch (error) {
                return failure({
                    reason: DatabaseReadFailureReason.unknown
                });
            }
        } else {
            return failure({
                reason: DatabaseReadFailureReason.documentNotFound
            });
        }
    }

    async readAll<T>(parameters: {
        collection: String,
        where: {
            operandOne: String,
            operator: ReadAllQueryOperator,
            operandTwo: String,
        }
    }): Promise<Either<DatabaseReadSuccess, DatabaseReadFailure>> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const queryRef = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo
        );

        const querySnapshot = await queryRef.get();
        const data = querySnapshot.docs.map((doc) => doc.data);

        return success({
            data: data
        });
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
            } catch (error) {
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
            operator: ReadAllQueryOperator,
            operandTwo: String,
        }
    }): Promise<Either<DatabaseDeleteSuccess, DatabaseDeleteFailure>> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const queryRef = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo
        );

        const querySnapshot = await queryRef.get();

        for (const doc of querySnapshot.docs) {
            await doc.ref.delete();
        }

        return success({});
    }
}