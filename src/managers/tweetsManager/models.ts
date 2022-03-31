export interface Tweet {
    readonly tweetId: String;
    readonly foreignId: String;
    readonly text: String;
    readonly creationDate: Number;
    readonly authorSid: String;
    readonly meta: Meta
}

export interface Meta {
    readonly likesCount: Number;
}