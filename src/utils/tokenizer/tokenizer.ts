import * as jwt from "jsonwebtoken";

import Secrets from '../../secrets.json';

export class Tokenizer {
    static readonly shared = new Tokenizer();

    private constructor() { }

    token(parameters: {
        payload: Object,
    }): String {
        const token = jwt.sign(
            parameters.payload,
            process.env.JWT_SECRET || Secrets.jwt.secret
        );

        return token;
    }

    payload<T>(parameters: {
        token: String
    }): T | null {
        const object = jwt.decode(parameters.token.valueOf());

        if (object !== null) {
            return (object as jwt.Jwt).payload as unknown as T;
        }

        return null;
    }

    verify(parameters: {
        token: String
    }): Boolean {
        try {
            jwt.verify(
                parameters.token.valueOf(),
                process.env.JWT_SECRET || Secrets.jwt.secret
            );

            return true;
        } catch {
            return false;
        }
    }
}