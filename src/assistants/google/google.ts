import { Either, Empty, failure, success } from "../../utils/typescriptx/typescriptx";
import { Network } from "../network/network";
import { Person } from "./types";


class Google {
    private _shared = new Google();
    public shared = (): Google => this._shared;

    async details(parameters: { accessToken: String }): Promise<Either<Person, Empty>> {
        const person = await Network.shared().get({
            url: `https://www.googleapis.com/plus/v1/people/me`,
            headers: {
                authorization: `Bearer ${parameters.accessToken}`
            }
        });

        if (person.statusCode === 200) {
            const data: {
                id: String,
                name: {
                    familyName: String,
                    givenName: String,
                },
                image: {
                    url: String
                },
                emails: {
                    value: String,
                    type: String
                }[]
            } = person.data;

            return success({
                name: data.name.givenName + ' ' + data.name.familyName,
                email: data.emails.filter((email) => email.type === 'ACCOUNT')[0].value,
                profilePictureUrl: data.image.url
            });
        } else {
            return failure({});
        }
    }
}