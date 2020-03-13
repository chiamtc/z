import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './controllers/auth_user';
import ProjectRouter from "./controllers/project";
import PersonRouter from "./controllers/person";
import IssueRouter from "./controllers/issue";

APIRouter.use('/users', AuthUserRouter);
APIRouter.use('/persons', PersonRouter);
APIRouter.use('/projects', ProjectRouter);
APIRouter.use('/issues', IssueRouter);

export default APIRouter;
