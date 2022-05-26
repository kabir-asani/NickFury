export enum LogLevel {
    informative,
    attention,
}

const logger = (
    data: any,
    level: LogLevel = LogLevel.informative,
    location: any = undefined,
    enableOnProduction: boolean = false
) => {
    let isLogAllowed: boolean =
        process.env.NODE_ENV === "production" ? enableOnProduction : true;

    if (isLogAllowed) {
        switch (level) {
            case LogLevel.informative: {
                if (location !== undefined) {
                    console.log(location);
                }
                console.log(data);
                break;
            }
            case LogLevel.attention: {
                if (location !== undefined) {
                    console.error(location);
                }
                console.error(data);
            }
        }
    }
};

export default logger;
