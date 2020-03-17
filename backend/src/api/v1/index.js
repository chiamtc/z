import {Router} from 'express';
const APIRouter = Router();

import AuthUserRouter from './controllers/auth_user';
import ProjectRouter from "./controllers/project";
import PersonRouter from "./controllers/person";
import IssueRouter from "./controllers/issue";
import IssueHistoryRouter from "./controllers/issue_history";
import SprintRouter from "./controllers/sprint";

APIRouter.use('/users', AuthUserRouter);
APIRouter.use('/persons', PersonRouter);
APIRouter.use('/projects', ProjectRouter);
APIRouter.use('/issues', IssueRouter);
APIRouter.use('/histories', IssueHistoryRouter);
APIRouter.use('/sprints', SprintRouter);

export default APIRouter;
