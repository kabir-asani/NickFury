import axios from "axios";

export class NetworkResult {
    statusCode: Number;
    data?: any;

    constructor(parameters: {
        statusCode: Number
        data?: any,
    }) {
        this.statusCode = parameters.statusCode;
        this.data = parameters.data;
    }
}

export class NetworkAssistant {
    private static _shared = new NetworkAssistant();
    public static shared = (): NetworkAssistant => this._shared;

    async get(parameters: {
        url: String,
        headers?: {
            [key: string]: string
        }
    }): Promise<NetworkResult> {
        const options = {
            headers: parameters.headers,
            validateStatus: () => true,
        };

        const result = await axios.get(
            parameters.url.valueOf(),
            options,
        );

        const reply = new NetworkResult({
            statusCode: result.status,
            data: result.data,
        });

        return reply;
    }

    async post(parameters: {
        url: String,
        headers?: {
            [key: string]: string
        },
        body?: any
    }): Promise<NetworkResult> {
        const options = {
            headers: parameters.headers,
            data: parameters.body,
            validateStatus: () => true,
        }

        const result = await axios.post(
            parameters.url.valueOf(),
            options,
        );

        const reply = new NetworkResult({
            statusCode: result.status,
            data: result.data,
        });

        return reply;
    }
}