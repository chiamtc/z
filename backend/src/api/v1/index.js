import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './controllers/auth_user';
import ProjectRouter from "./controllers/project";
import PersonRouter from "./controllers/person";
import IssueRouter from "./controllers/issue";
import IssueHistoryRouter from "./controllers/issue_history";

APIRouter.use('/users', AuthUserRouter);
APIRouter.use('/persons', PersonRouter);
APIRouter.use('/projects', ProjectRouter);
APIRouter.use('/issues', IssueRouter);
APIRouter.use('/histories', IssueHistoryRouter);

export default APIRouter;
