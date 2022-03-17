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

export interface DatabaseDeleteAllSuccess {

}

export interface DatabaseDeleteAllFailure {
    reason: DatabaseDeleteAllFailureReason;
}

export enum DatabaseDeleteAllFailureReason {
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

export type DeleteAllQueryOperator = | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'in'
    | 'not-in'
    | 'array-contains-any';