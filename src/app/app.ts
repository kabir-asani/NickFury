import express, { json } from 'express';
import { caseme } from './middlewares/caseme/caseme';
import storyteller from './middlewares/storyteller/storyteller';
import samaritans from './routes/samaritans/samaritans';
import sessions from './routes/sessions/sessions';

const app = express();

// Middlewares
app.use(json());
app.use(caseme());
app.use(storyteller());

// Routers
app.use('/sessions', sessions);
app.use('/samaritans', samaritans);

export = app;