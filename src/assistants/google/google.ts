import { Either, Empty, failure, success } from "../../utils/typescriptx/typescriptx";
import secrets from '../../secrets.json';
import { Network } from "../network/network";
import { Person } from "./types";


class Google {
    private _shared = new Google();
    public shared = (): Google => this._shared;

    async details(parameters: {accessToken: String}): Promise<Either<Person, Empty>> {
        const person = await Network.shared().get({
            url: `https://www.googleapis.com/plus/v1/people/me?access_token=${parameters.accessToken}&key=${secrets.google.apiKey}`
        });

        if (person.statusCode >= 200 && person.statusCode < 300) {
            const name = person.data.names[0].displayName;
            const email = person.data.emailAddresses[0].value;
            const profilePictureUrl = person.data.coverPhotos[0].url;

            return success({
                name,
                email,
                profilePictureUrl,
            });
        } else {
            return failure({}); 
        }
    }
}