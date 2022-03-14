// MODELS
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

// SUCCESS, FAILURE

// Create Samaritan
export interface SamaritanCreateSuccess {
    samaritan: Samaritan;
}

export interface SamaritanCreateFailure {
    reason: SamaritanCreateFailureReason;
}

export enum SamaritanCreateFailureReason {
    unknown,
    samaritanAlreadyPresent
}

// Read Samaritan
export interface SamaritanReadSuccess {
    samaritan: Samaritan;
}

export interface SamaritanReadFailure {
    reason: SamaritanReadFailureReason;
}

export enum SamaritanReadFailureReason {
    unknwon
}