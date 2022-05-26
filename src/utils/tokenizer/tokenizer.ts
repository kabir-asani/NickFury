import * as jwt from "jsonwebtoken";

import Secrets from "../../secrets.json";

export class Tokenizer {
    static readonly shared = new Tokenizer();

    private constructor() {}

    encode<T extends Object>(parameters: { payload: T }): String {
        const token = jwt.sign(
            parameters.payload,
            process.env.JWT_SECRET || Secrets.jwt.secret
        );

        return token;
    }

    decode<T extends Object>(parameters: { token: String }): T | null {
        const object = jwt.decode(parameters.token.valueOf());

        if (object !== null) {
            const payload = object as unknown as T;

            return payload;
        }

        return null;
    }

    verify(parameters: { token: String }): Boolean {
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
