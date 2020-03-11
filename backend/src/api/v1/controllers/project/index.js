import {Router} from 'express';
import passport from 'passport';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse_Utils from "../../../../utils/HttpResponse_Utils";
import HttpRequest_Utils from "../../../../utils/HttpRequest_Utils";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";

const ProjectRouter = Router();

const ResponseUtil = new HttpResponse_Utils();
const RequestUtil = new HttpRequest_Utils();

//this endpoint should not be consumed at all
ProjectRouter.get('/all', authenticate_jwtStrategy, async (req, res) => {
    let queryLimit = 5, queryOffset = 0;
    const client = await db.client();
    try {
        if (req.query.hasOwnProperty('limit')) {
            const {limit} = req.query;
            queryLimit = parseInt(limit);
            if (queryLimit <= 0) {
                ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.baseUrl} - Sanitizing Process: query limit must be more than equal 1`);
                ResponseUtil.responds(res);
            }
        }
        if (req.query.hasOwnProperty('offset')) {
            const {offset} = req.query;
            queryOffset = parseInt(offset);
        }
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.baseUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        let getProject_Q_values = [queryLimit, queryOffset];
        const getProjects_Q = `select * from project limit $1 offset $2`;
        const getProjects_R = await client.query(getProjects_Q, getProject_Q_values);

        const getCount_Q = `select COUNT(*) from project`;
        const getCount_R = await client.query(getCount_Q);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = queryLimit * (queryOffset + 1) < total_count;
        await client.query('commit');

        ResponseUtil.setResponse(200, ResponseFlag.OK, {projects: getProjects_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

ProjectRouter.post('/', authenticate_jwtStrategy, async(req,res)=>{
    const client = db.client();
    try{
        RequestUtil.extract_request_header(req);
        const body = ResponseUtil.body;
        await client.query('begin');
        //TODO: db-migrate create project_participant sql
        //TODO: insert project query

        //TODO: insert project_participant query

        await client.query('commit');
    }catch(e){
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }finally{
        await client.release();
    }

})


ProjectRouter.get('/', authenticate_jwtStrategy, (req, res) => {
    const {auth_user_id, person_id} = req.user;


});

export default ProjectRouter
