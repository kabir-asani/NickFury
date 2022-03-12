import express, { json } from 'express';
import storyteller from './middlewares/storyteller/storyteller';

const app = express();

app.use(json());

app.use(storyteller());

export = app;