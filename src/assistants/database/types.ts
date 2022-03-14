// Write
export interface DatabaseWriteSuccess {
    id: String;
}

export interface DatabaseWriteFailure {
    reason: DatabaseWriteFailureReason;
}

export enum DatabaseWriteFailureReason {
    unknown,
    documentCannotBeOverwritten
}

// Read
export interface DatabaseReadSuccess {
    data: any;
}

export interface DatabaseReadFailure {
    reason: DatabaseReadFailureReason;
}

export enum DatabaseReadFailureReason {
    unknown,
    documentNotFound
}

// Delete
export interface DatabaseDeleteSuccess {

}

export interface DatabaseDeleteFailure {
    reason: DatabaseDeleteFailureReason;
}

export enum DatabaseDeleteFailureReason {
    unknown,
    documentNotFound
}

export type ReadAllQueryOperator = | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'in'
    | 'not-in'
    | 'array-contains-any';