import { Samaritan } from "./models";

class SamaritanSuccess { }
class SamaritanFailure { }


// Create Samaritan
export class CreateSamaritanSuccess extends SamaritanSuccess {
    samaritan: Samaritan;

    constructor(parameters: {
        samaritan: Samaritan;
    }) {
        super();
        this.samaritan = parameters.samaritan;
    }
}

export abstract class CreateSamaritanFailure extends SamaritanFailure { }

export class UnkownCreateSamritanFailure extends CreateSamaritanFailure { }

export class SamaritanAlreadyExists extends CreateSamaritanFailure { }
