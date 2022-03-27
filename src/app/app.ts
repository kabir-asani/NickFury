import express, { json } from 'express';
import { RouteSuccess } from './core/types';
import { caseme } from './middlewares/caseme/caseme';
import storyteller from './middlewares/storyteller/storyteller';
import sessions from './routes/session/session';

const app = express();

// Middlewares
app.use(json());
app.use(storyteller());
app.use(caseme());

// Routers
app.use('/sessions', sessions);

export = app;