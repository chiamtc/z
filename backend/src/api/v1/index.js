import express from 'express';
const APIRouter = express.Router();

import users from './users';
APIRouter.use('/user', users);

export default APIRouter;
