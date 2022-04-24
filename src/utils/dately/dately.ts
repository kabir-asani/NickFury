import moment from "moment";

export class Dately {
    public static readonly shared = new Dately();

    private constructor() { }

    now(): String {
        const now = moment();
        const nowFormattedAccordingToISO8601 = now.format();

        return nowFormattedAccordingToISO8601;
    }
}