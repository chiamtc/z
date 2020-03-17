import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import HttpRequest from "../../../../utils/HttpRequest";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";
import QueryConstant from "../../../../constants/query";

const SprintRouter = Router();
const ResponseUtil = new HttpResponse();
const RequestUtil = new HttpRequest();

SprintRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createSprint_ref = new Map();
    createSprint_ref.set('sprint_name', 's');
    createSprint_ref.set('sprint_goal', 's');
    createSprint_ref.set('start_date', 's');
    createSprint_ref.set('end_date', 's');
    createSprint_ref.set('project_id', 'd');

    try {
        SanitizerUtil.sanitize_reference = createSprint_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');

        //create sprint
        const createSprint_Q = `insert into sprint(${f.query_string}) values (${SanitizerUtil.build_values(f.query_val)}) returning *`;
        const createSprint_R = await client.query(createSprint_Q, f.query_val);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, createSprint_R.rows[0]);
        ResponseUtil.responds(res);

    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

SprintRouter.get('/', authenticate_jwtStrategy, async (req, res) => {
});


export default SprintRouter;
