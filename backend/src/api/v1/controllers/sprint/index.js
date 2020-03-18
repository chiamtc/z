import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";
import QueryConstant from "../../../../constants/query";

const SprintRouter = Router();
const ResponseUtil = new HttpResponse();

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
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
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
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

SprintRouter.get('/:id', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    try {
        await client.query('begin');
        const {id} = req.params;
        //create sprint
        const getSprint_Q_values = [id];
        const getSprint_Q = `select * from sprint where sprint_id=$1`;
        const getSprint_R = await client.query(getSprint_Q, getSprint_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getSprint_R.rows.length !== 0 ? getSprint_R.rows[0] : {});
        ResponseUtil.responds(res);

    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

SprintRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const updateSprint_ref = new Map();
    updateSprint_ref.set('sprint_name', 's');
    updateSprint_ref.set('sprint_goal', 's');
    updateSprint_ref.set('start_date', 's');
    updateSprint_ref.set('end_date', 's');

    try {
        SanitizerUtil.sanitize_reference = updateSprint_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        const {id} = req.params;
        await client.query('begin');
        const updateSprint_Q_values = [...f.query_val, id]
        const updateSprint_Q = `update sprint set ${f.query_string} where sprint_id=$${updateSprint_Q_values.length} returning *`;
        const updateSprint_R = await client.query(updateSprint_Q, updateSprint_Q_values);
        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateSprint_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

SprintRouter.delete('/:id', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');
        const query_values = [id];
        const releaseIssue_Q = `update issue set sprint_id = null where sprint_id=$1 returning *`;
        const releaseIssue_R = await client.query(releaseIssue_Q, query_values);

        const deleteSprint_Q = `delete from sprint where sprint_id=$1 returning *`;
        const deleteSprint_R = await client.query(deleteSprint_Q, query_values);

        if (deleteSprint_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, sprint:deleteSprint_R.rows[0], issues: releaseIssue_R.rows});
        } else {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted:false});
        }

        await client.query('commit');
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
    //update issue set sprint_id = null where sprint_id=$1 returning *;
});

export default SprintRouter;
