import app from "./app/app";
import logger from "./utils/logger/logger";

const port = process.env.PORT || 300;

app.listen(port, () => {
    logger(`Listening on localhost:${port}`);
});