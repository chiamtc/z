import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './auth_user';
APIRouter.use('/user', AuthUserRouter);

export default APIRouter;
