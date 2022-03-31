import { Session } from "./models";

export class SessionSuccess { }
export class SessionFailure { }

// Create Session
export class CreateSessionSuccess extends SessionSuccess {
    readonly session: Session;

    constructor(parameters: {
        session: Session
    }) {
        super();
        this.session = parameters.session;
    }
}

export abstract class CreateSessionFailure extends SessionFailure { }

export class UnknownCreateSessionFailure extends CreateSessionFailure { }

// Delete Session
export class DeleteSessionSuccess extends SessionSuccess { }

export abstract class DeleteSessionFailure extends SessionFailure { }

export class UnkknownDeleteSessionFailure extends DeleteSessionFailure { }

// Delete All Existing Sessions
export class DeleteAllExistingSessionsSuccess extends SessionSuccess { }

export abstract class DeleteAllExistingSessionsFailure extends SessionFailure { }

export class UnknownDeleteAllExistingSessionsFailure extends DeleteAllExistingSessionsFailure { }
