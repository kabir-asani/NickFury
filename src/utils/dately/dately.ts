import moment from "moment";

export default class Dately {
    public static readonly shared = new Dately();

    private constructor() {}

    now(): String {
        const now = moment();
        const nowFormattedAccordingToISO8601 = now.utc().format();

        return nowFormattedAccordingToISO8601;
    }
}
