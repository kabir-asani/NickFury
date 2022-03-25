import { Session } from "../sessionManager/models";

class AuthManagerSuccess { }
class AuthManagerFailure { }

// Log In
export class LogInSuccess extends AuthManagerSuccess {
    session: Session;

    constructor(parameters: {
        session: Session;
    }) {
        super();
        this.session = parameters.session;
    }
}

export abstract class LogInFailure extends AuthManagerFailure { }

export class UnknownLogInFailure extends AuthManagerFailure { }

export class UnknownAuthProvider extends LogInFailure { }

export class IllegalAccessTokenFailure extends LogInFailure { }

// Log Out
export class LogOutSuccess extends AuthManagerSuccess { }

export abstract class LogOutFailure extends AuthManagerFailure { }

export class UnknownLogOutFailure extends LogOutFailure { }