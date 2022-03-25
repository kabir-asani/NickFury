export class DatabaseSuccess { }

export class DatabaseFailure { }

// Exists
export interface ExistsParameters {
    collection: String,
    document: String
}

// Exists Any
export interface ExistsAnyParameters {
    collection: String,
    where: {
        operandOne: String,
        operator: BatchReadQueryOperator,
        operandTwo: any,
    },
}

// Read
export interface ReadParameters {
    collection: String,
    document: String
}

// Read All
export interface BatchReadParameters {
    collection: String,
    where: {
        operandOne: String,
        operator: BatchReadQueryOperator,
        operandTwo: any,
    }
}

export type BatchReadQueryOperator = | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'in'
    | 'not-in'
    | 'array-contains-any';

// Write
export interface WriteParameters {
    collection: String;
    document: String;
    data: any;
}

export class WriteSuccess extends DatabaseSuccess { }
export class WriteFailure extends DatabaseFailure { }

export class ExistingDocumentCannotBeOverwritten extends WriteFailure { }

// Write All
export interface BatchWriteParameters {
    writes: WriteParameters[];
}

export class BatchWriteSuccess extends DatabaseSuccess { }
export class BatchWriteFailure extends DatabaseFailure { }

// Update
export interface UpdateParameters {
    collection: String;
    document: String;
    data: any;
}

export class UpdateSuccess extends DatabaseSuccess { }
export class UpdateFailure extends DatabaseFailure { }

export class MissingDocumentCannotBeUpdated extends UpdateFailure { }

// Delete
export interface DeleteParameters {
    collection: String;
    document: String;
}

export class DeleteSuccess extends DatabaseSuccess { }
export class DeleteFailure extends DatabaseFailure { }

export class MissingDocumentCannotBeDeleted extends DeleteFailure { }

// Delete All
export interface BatchDeleteParameters {
    collection: String,
    where: {
        operandOne: String,
        operator: BatchDeleteQueryOperator,
        operandTwo: any,
    }
}

export class BatchDeleteSuccess extends DatabaseSuccess { }
export class BatchDeleteFailure extends DatabaseFailure { }

export type BatchDeleteQueryOperator = | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'in'
    | 'not-in'
    | 'array-contains-any';