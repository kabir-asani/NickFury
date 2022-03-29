export interface Tweet {
    readonly tid: String;
    readonly fid: String;
    readonly text: String;
    readonly creationDate: Number;
    readonly authorSid: String;
    readonly meta: Meta
}

export interface Meta {
    readonly likesCount: Number;
}