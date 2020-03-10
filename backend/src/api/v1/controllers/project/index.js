import {Router} from 'express';
import passport from 'passport';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse_Utils from "../../../../utils/HttpResponse_Utils";
import ResponseFlag from "../../../../constants/response_flag";

const ProjectRouter = Router();

const ResponseUtil = new HttpResponse_Utils();

ProjectRouter.get('/', authenticate_jwtStrategy,(req, res, next)=>{
    console.log('project endpoint',req.user)

    ResponseUtil.setResponse(201, ResponseFlag.OK,req.user);
    ResponseUtil.responds(res);
});
export default ProjectRouter
