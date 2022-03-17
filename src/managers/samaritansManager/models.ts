export interface Samaritan {
    sid: String,
    name: String,
    email: String;
    username: String,
    image: String,
    creationDate: Number,
    socialDetails: {
        followersCount: Number,
        followingCount: Number,
    },
    tweetsDetails: {
        tweetsCount: Number,
        retweetsCount: Number,
    },
}