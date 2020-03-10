import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './controllers/auth_user';
import ProjectRouter from "./controllers/project";
APIRouter.use('/users', AuthUserRouter);
APIRouter.use('/projects', ProjectRouter);

export default APIRouter;
