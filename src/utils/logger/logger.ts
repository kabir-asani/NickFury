const logger = (
    data: Object,
    options: { enableOnProduction: boolean } = { enableOnProduction: true }
) => {
    let isLogAllowed: boolean = process.env.NODE_ENV === 'production' ? options.enableOnProduction : true;

    if (isLogAllowed) {
        console.log(data);
    }
};

export = logger;