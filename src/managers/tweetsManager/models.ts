import { Samaritan } from "../samaritansManager/models";

export interface Tweet {
    readonly tweetId: String;
    readonly foreignId: String;
    readonly text: String;
    readonly creationDate: String;
    readonly authorSid: String;
    readonly meta: {
        readonly likesCount: Number;
    } 
}

export interface EnrichedTweet extends Tweet {
    author: Samaritan; 
}