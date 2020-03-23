import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";
import Sprint from "../../models/Sprint";

const SprintRouter = Router();
const ResponseUtil = new HttpResponse();
const SprintModel = new Sprint();
SprintRouter.post('/', authenticate_jwtStrategy, SprintModel.sanitize_post_sanitizer, async (req, res) => {
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    try {
        await client.query('begin');
        //create sprint
        const createSprint_Q = `insert into sprint(${req.post_ops.query_string}) values (${SanitizerUtil.build_values(req.post_ops.query_val)}) returning *`;
        const createSprint_R = await client.query(createSprint_Q, req.post_ops.query_val);

        await client.query('commit');
        ResponseUtil.setResponse(201, ResponseFlag.OK, createSprint_R.rows[0]);
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

SprintRouter.put('/:id', authenticate_jwtStrategy, SprintModel.sanitize_put_sanitizer, async (req, res) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');
        const updateSprint_Q_values = [...req.put_ops.query_val, id]
        const updateSprint_Q = `update sprint set ${req.put_ops.query_string} where sprint_id=$${updateSprint_Q_values.length} returning *`;
        const updateSprint_R = await client.query(updateSprint_Q, updateSprint_Q_values);
        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateSprint_R.rows.length === 0 ? {} : updateSprint_R.rows[0]);
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
            ResponseUtil.setResponse(200, ResponseFlag.OK, {
                deleted: true,
                sprint: deleteSprint_R.rows[0],
                issues: releaseIssue_R.rows
            });
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});

        await client.query('commit');
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

SprintRouter.get('/projects/:projectId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);

    try {
        const {projectId} = req.params;
        await client.query('begin');
        let getProjectSprint_Q_values = [projectId, paginator.limit, paginator.offset];
        const getProjectsSprint_Q = `select * from sprint where project_id=$1 limit $2 offset $3`;
        const getProjectsSprint_R = await client.query(getProjectsSprint_Q, getProjectSprint_Q_values);

        const getCount_Q = `select COUNT(*) from sprint where project_id=$1`;
        const getCount_R = await client.query(getCount_Q, [getProjectSprint_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);
        await client.query('commit');

        ResponseUtil.setResponse(200, ResponseFlag.OK, {sprints: getProjectsSprint_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default SprintRouter;
