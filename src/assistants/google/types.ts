export class GoogleProfileSuccess {
    profile: GoogleProfile;

    constructor(parameters: {
        profile: GoogleProfile;
    }) {
        this.profile = parameters.profile;
    }
}

export abstract class GoogleProfileFailure { }

export class UnknownGoogleProfileFailure extends GoogleProfileFailure { }

export class IllegalAccessTokenFailure extends GoogleProfileFailure { }

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