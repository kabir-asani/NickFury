export class GoogleProfile {
    name: String;
    email: String;
    image: String;

    constructor(parameters: {
        name: String;
        email: String;
        image: String;
    }) {
        this.name = parameters.name;
        this.email = parameters.email;
        this.image = parameters.image;
    }
}

export enum GoogleProfileFailure {
    UNKNOWN,
    INCORECT_ACCESS_TOKEN
}