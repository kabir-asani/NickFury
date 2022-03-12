export abstract class Either<S, F> {
    abstract resolve<T>(parameters: {onSuccess: (s: S) => T, onFailure: (f: F) => T}): T;
}

export class Success<S, F> extends Either<S, F> {
    success: S;

    constructor(success: S) {
        super();

        this.success = success;
    }

    resolve<T>(parameters: {onSuccess: (s: S) => T, onFailure: (f: F) => T}): T {
        return parameters.onSuccess(this.success);
    }
}

export class Failure<S, F> extends Either<S, F> {
    failure: F;

    constructor(failure: F) {
        super();

        this.failure = failure;
    }

    resolve<T>(parameters: {onSuccess: (s: S) => T, onFailure: (f: F) => T}): T {
        return parameters.onFailure(this.failure);
    }
}


export const success = <S, F>(success: S): Either<S, F> => {
    const conversion = new Success<S, F>(success);

    return conversion;
}

export const failure = <S, F>(failure: F): Either<S, F> => {
    const conversion = new Failure<S, F>(failure);

    return conversion;
}