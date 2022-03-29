export interface Samaritan {
    readonly sid: String,
    readonly name: String,
    readonly email: String;
    readonly username: String,
    readonly image: String,
    readonly creationDate: Number,
    readonly socialDetails: {
        readonly followersCount: Number,
        readonly followingCount: Number,
    },
    readonly tweetsDetails: {
        readonly tweetsCount: Number,
        readonly retweetsCount: Number,
    },
}