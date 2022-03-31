export class Dately {
    public static readonly shared = new Dately();

    now(): String {
        return Date.now().toString();
    }
}