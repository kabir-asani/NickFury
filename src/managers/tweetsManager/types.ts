import { Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Tweet } from "./models";

// Create Tweet
export enum CreateTweetFailure {
    UNKNOWN,
}

// Delete Tweet
export enum DeleteTweetFailure {
    UNKNOWN,
    DOES_NOT_EXISTS
}