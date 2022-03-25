import { firestore } from "firebase-admin";
import { Firebase } from "../firebase/firebase";
import {
    BatchDeleteFailure,
    BatchDeleteSuccess,
    BatchWriteFailure,
    BatchWriteSuccess,
    DeleteFailure,
    DeleteParameters,
    DeleteSuccess,
    ExistingDocumentCannotBeOverwritten,
    ExistsAnyParameters,
    ExistsParameters,
    MissingDocumentCannotBeDeleted,
    ReadParameters,
    WriteFailure,
    WriteParameters,
    WriteSuccess,
    BatchReadParameters,
    BatchDeleteParameters,
    BatchWriteParameters,
} from "./types";

export class Database {
    public static readonly shared = new Database();

    private db = firestore(Firebase.shared().app());

    async exists(parameters: ExistsParameters): Promise<Boolean> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const documentRef = collectionRef.doc(parameters.document.valueOf());

        const doc = await documentRef.get();

        if (doc.exists) {
            return true;
        } else {
            return false;
        }
    }

    async existsAny(parameters: ExistsAnyParameters): Promise<Boolean> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const query = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo,
        );

        const querySnapshot = await query.get();

        if (querySnapshot.empty) {
            return false;
        } else {
            return true;
        }
    }

    async write(parameters: WriteParameters): Promise<WriteSuccess | WriteFailure> {
        const isDocumentAlreadyExisting = await this.exists({
            collection: parameters.collection,
            document: parameters.document!,
        });

        if (isDocumentAlreadyExisting) {
            const reply = new ExistingDocumentCannotBeOverwritten();
            return reply;
        }

        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const documentRef = collectionRef.doc(parameters.document.valueOf());

        await documentRef.set(parameters.data);

        const reply = new WriteSuccess();
        return reply;
    }

    async writeAll(parameters: BatchWriteParameters): Promise<BatchWriteSuccess | BatchWriteFailure> {
        try {
            const batch = this.db.batch();

            for (const writeDetails of parameters.writes) {
                const collectionRef = this.db.collection(writeDetails.collection.valueOf());
                const documentRef = collectionRef.doc(writeDetails.document.valueOf());

                batch.create(
                    documentRef,
                    writeDetails.data
                );
            }

            await batch.commit();

            const reply = new BatchWriteSuccess();
            return reply;
        } catch {
            const reply = new BatchWriteFailure();
            return reply;
        }
    }

    async read<T>(parameters: ReadParameters): Promise<T | null> {
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

    async readAll<T>(parameters: BatchReadParameters): Promise<T[] | null> {
        const collectionRef = this.db.collection(parameters.collection.valueOf());
        const queryRef = collectionRef.where(
            parameters.where.operandOne.valueOf(),
            parameters.where.operator,
            parameters.where.operandTwo,
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

    async delete(parameters: DeleteParameters): Promise<DeleteSuccess | DeleteFailure> {
        const isDocumentExisting = await this.exists({
            collection: parameters.collection,
            document: parameters.document,
        });

        if (isDocumentExisting) {
            const collectionRef = this.db.collection(parameters.collection.valueOf());
            const documentRef = collectionRef.doc(parameters.document.valueOf());

            await documentRef.delete();

            const reply = new DeleteSuccess();
            return reply;
        } else {
            const reply = new MissingDocumentCannotBeDeleted();
            return reply;
        }
    }

    async deleteAll(parameters: BatchDeleteParameters): Promise<BatchDeleteSuccess | BatchDeleteFailure> {
        try {
            const collectionRef = this.db.collection(parameters.collection.valueOf());
            const queryRef = collectionRef.where(
                parameters.where.operandOne.valueOf(),
                parameters.where.operator,
                parameters.where.operandTwo,
            );

            const querySnapshot = await queryRef.get();
            const documentRefs = querySnapshot.docs.map((document) => document.ref);

            const batch = this.db.batch();

            for (const documentRef of documentRefs) {
                batch.delete(documentRef);
            }

            await batch.commit();

            const reply = new BatchDeleteSuccess();
            return reply;
        } catch {
            const reply = new BatchDeleteFailure();
            return reply;
        }
    }
}