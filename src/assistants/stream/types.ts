export interface Activity {
    actor: String;
    verb: String;
    object: String;
}

export class AddActivitySuccess {
    tid: String;
    
    constructor(parameters: {
        tid: String
    }) {
        this.tid = parameters.tid;
    }
 }

export class AddActivityFailure { }

export class UnknownAddActivityFailure extends AddActivityFailure { }