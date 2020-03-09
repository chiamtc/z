import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './controllers/auth_user';
APIRouter.use('/users', AuthUserRouter);

export default APIRouter;
