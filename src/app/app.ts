import express, { json } from "express";
import { caseme } from "./middlewares/caseme/caseme";
import { gatekeeper } from "./middlewares/gatekeeper/gatekeeper";
import storyteller from "./middlewares/storyteller/storyteller";
import samaritans from "./routes/samaritans/samaritans";
import sessions from "./routes/sessions/sessions";
import tweets from "./routes/tweets/tweets";

const app = express();

// Middlewares
app.use(json());
app.use(caseme());
app.use(storyteller());

// Routers
app.use(
    "/sessions",
    sessions,
);

app.use(
    "/samaritans",
    gatekeeper(),
    samaritans,
);

app.use(
    "/tweets",
    gatekeeper(),
    tweets,
);

export = app;