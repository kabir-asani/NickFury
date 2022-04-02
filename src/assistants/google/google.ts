import { Failure, Success } from "../../utils/typescriptx/typescriptx";
import { NetworkAssistant } from "../network/network";
import { GoogleProfile, GoogleProfileFailure } from "./types";

export class GoogleAssistant {
    public static readonly shared = new GoogleAssistant();

    async profile(parameters: { accessToken: String }): Promise<Success<GoogleProfile> | Failure<GoogleProfileFailure>> {
        const person = await NetworkAssistant.shared().get({
            url: `https://www.googleapis.com/plus/v1/people/me`,
            headers: {
                authorization: `Bearer ${parameters.accessToken}`
            }
        });


        if (person.statusCode >= 400 && person.statusCode < 500) {
            const result = new Failure<GoogleProfileFailure>(GoogleProfileFailure.INCORECT_ACCESS_TOKEN);
            return result;
        }

        if (person.statusCode >= 200 && person.statusCode < 300) {
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

            const profile = new GoogleProfile({
                name: data.name.givenName + ' ' + data.name.familyName,
                email: data.emails.filter((email) => email.type === 'ACCOUNT')[0].value,
                image: data.image.url
            });

            const result = new Success<GoogleProfile>(profile);

            return result;
        }


        const result = new Failure<GoogleProfileFailure>(GoogleProfileFailure.UNKNOWN);
        return result;
    }
}