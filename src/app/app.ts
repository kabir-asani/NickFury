import express, { json } from 'express';
import storyteller from './middlewares/storyteller/storyteller';
import authentication from './routes/authentication/authentication';

const app = express();

// Middlewares
app.use(json());
app.use(storyteller());

// Routers
app.use('/auth', authentication);

export = app;