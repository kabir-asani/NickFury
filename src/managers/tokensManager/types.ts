export class AuthProvider {
    static readonly apple = new AuthProvider({
        value: "apple",
    });

    static readonly google = new AuthProvider({
        value: "google",
    });

    private readonly value: String;

    constructor(parameters: { value: String }) {
        this.value = parameters.value;
    }

    valueOf(): String {
        return this.value;
    }
}

export interface Credentials {
    readonly accessToken: String;
}

export enum TokenValidationFailureReason {
    unknown,
    invalidToken,
}

export enum TokenCreationFailureReason {
    unknown,
}

export enum TokenDeletionFailureReason {
    unknown,
}
