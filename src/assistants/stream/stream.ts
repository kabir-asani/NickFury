import * as Stream from 'getstream';
import Secrets from '../../secrets.json';

export class StreamAssistant {
    public static readonly shared = new StreamAssistant();

    private client = Stream.connect(
        Secrets.stream.key,
        Secrets.stream.secret
    );

    token(parameters: {
        sid: String;
    }): String {
        const token = this.client.createUserToken(parameters.sid.valueOf());

        return token;
    }
}