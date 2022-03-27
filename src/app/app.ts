import express, { json } from 'express';
import { RouteSuccess } from './core/types';
import { caseme } from './middlewares/caseme/caseme';
import storyteller from './middlewares/storyteller/storyteller';
import authentication from './routes/authentication/authentication';

const app = express();

// Middlewares
app.use(json());
app.use(storyteller());
app.use(caseme());

// Routers
app.use('/auth', authentication);

export = app;