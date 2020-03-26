import {Router} from 'express';
const APIRouter = Router();

import {authenticate_jwtStrategy} from "../../auth/local_strategy_utils";

import AuthUserRouter from './controllers/auth_user';
import ProjectRouter from "./controllers/project";
import PersonRouter from "./controllers/person";
import IssueRouter from "./controllers/issue";
import IssueHistoryRouter from "./controllers/issue_history";
import SprintRouter from "./controllers/sprint";
import CommentRouter from "./controllers/comment";
import CommentHistoryRouter from "./controllers/comment_history";
import TimeTrackingRouter from "./controllers/time_tracking";
import TimeTrackingHistoryRouter from "./controllers/time_tracking_history";
import RoleRouter from "./controllers/role";
import PermissionRouter from "./controllers/permission";

APIRouter.use('/users', AuthUserRouter);

APIRouter.use(authenticate_jwtStrategy);
APIRouter.use('/persons', PersonRouter);
APIRouter.use('/projects', ProjectRouter);
APIRouter.use('/issues', IssueRouter);
APIRouter.use('/issue_histories', IssueHistoryRouter);
APIRouter.use('/sprints', SprintRouter);
APIRouter.use('/comments', CommentRouter);
APIRouter.use('/comment_histories', CommentHistoryRouter);
APIRouter.use('/time_tracking', TimeTrackingRouter);
APIRouter.use('/time_tracking_histories', TimeTrackingHistoryRouter);
APIRouter.use('/roles', RoleRouter);
APIRouter.use('/permissions', PermissionRouter);

export default APIRouter;
