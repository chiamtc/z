import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './controllers/auth_user';
import ProjectRouter from "./controllers/project";
import PersonRouter from "./controllers/person";

APIRouter.use('/users', AuthUserRouter);
APIRouter.use('/persons', PersonRouter);
APIRouter.use('/projects', ProjectRouter);

export default APIRouter;
