import express, { json } from "express";
import { caseme } from "./middlewares/caseme/caseme";
import { gatekeeper } from "./middlewares/gatekeeper/gatekeeper";
import storyteller from "./middlewares/storyteller/storyteller";
import sessions from "./routes/sessions/sessions";
import others from "./routes/users/others";
import self from "./routes/users/self";

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
    "/user",
    gatekeeper(),
    self,
);

app.use(
    "/users/:userId",
    gatekeeper(),
    others
);

export = app;