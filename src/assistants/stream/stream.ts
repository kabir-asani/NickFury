import * as Stream from 'getstream';
import { StreamClient } from 'getstream';
import Secrets from '../../secrets.json';
import { BookmarkFeedAssistant } from './feeds/bookmarkFeed/bookmarkFeed';
import { SelfFeedAssistant } from './feeds/selfFeed/selfFeed';
import { TimelineFeedAssistant } from './feeds/timelineFeed/timelineFeed';
import { LikeReactionAssistant } from './reactions/likeReaction/likeReaction';
import { CommentReactionAssistant } from './reactions/commentReaction/commentReaction';

export class StreamAssistant {
    public static readonly shared = new StreamAssistant();

    private readonly client: StreamClient;

    readonly userFeed: SelfFeedAssistant;
    readonly timelineFeed: TimelineFeedAssistant;
    readonly bookmarkFeed: BookmarkFeedAssistant;

    readonly likeReactions: LikeReactionAssistant;
    readonly commentReactions: CommentReactionAssistant;

    private constructor() {
        this.client = Stream.connect(
            process.env.STREAM_KEY || Secrets.stream.key,
            process.env.STREAM_SECRET || Secrets.stream.secret,
        );

        this.userFeed = new SelfFeedAssistant({
            client: this.client
        });

        this.timelineFeed = new TimelineFeedAssistant({
            client: this.client
        });

        this.bookmarkFeed = new BookmarkFeedAssistant({
            client: this.client
        });

        this.likeReactions = new LikeReactionAssistant({
            client: this.client
        });

        this.commentReactions = new CommentReactionAssistant({
            client: this.client
        });
    }
}
