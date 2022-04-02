import { Router } from "express";
import self from "./self";
import others from "./others";

const users = Router();

users.use("/self", self);
users.use("/:userId", others);

export = users;