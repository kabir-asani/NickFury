import express, { json } from "express";
import Joi from "joi";
import caseme from "./middlewares/caseme/caseme";
import gatekeeper from "./middlewares/gatekeeper/gatekeeper";
import soldier, { GroundZero } from "./middlewares/soldier/soldier";
import storyteller from "./middlewares/storyteller/storyteller";
import tokens from "./routes/tokens/tokens";
import others from "./routes/users/others/others";
import search from "./routes/search/search";
import self from "./routes/users/self/self";
import { userExistentialGuard } from "./routes/users/others/middlewares/userExistentialGuard";

const app = express();

// Middlewares
app.use(json());
app.use(caseme());
app.use(storyteller());

// Routers
app.use("/tokens", tokens);

app.use("/self", gatekeeper(), self);

app.use(
    "/users/:userId",
    [
        gatekeeper(),
        soldier({
            schema: Joi.object({
                userId: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters,
        }),
        userExistentialGuard(),
    ],
    others
);

app.use("/search", gatekeeper(), search);

export default app;
