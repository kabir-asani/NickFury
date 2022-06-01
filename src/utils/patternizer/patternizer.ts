export class Patternizer {
    static readonly shared = new Patternizer();

    private constructor() {}

    readonly imageUrl = /\.(jpg|jpeg|png)$/;
    readonly name = /^[a-zA-Z ]{2,100}$/;
    readonly username = /^[a-zA-Z0-9._]{1,100}$/;
}
