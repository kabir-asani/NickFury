export interface Tweet {
    tid: String;
    fid: String;
    text: String;
    creationDate: Number;
    authorSid: String;
    meta: Meta
}

export interface Meta {
    likesCount: Number;
}