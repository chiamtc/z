import {Router} from 'express';
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import Paginator from "../../../../utils/Paginator";
import HttpRequest from "../../../../utils/HttpRequest";
import Issue from "../../models/Issue";
import IssueMiddleware from '../../middlewares/issue'

const IssueRouter = Router();
const ResponseUtil = new HttpResponse();
const RequestUtil = new HttpRequest();
const IssueModel = new Issue();
const Issue_Middleware = new IssueMiddleware();

IssueRouter.post('/', IssueModel.sanitize_post_middleware, async (req, res, next) => {
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();
    try {
        await client.query('begin');

        //create issue
        const createIssue_Q = `insert into issue(${req.post_ops.query_string}) values (${SanitizerUtil.build_values(req.post_ops.query_val)}) returning *`;
        const createIssue_R = await client.query(createIssue_Q, req.post_ops.query_val);

        //create issue_participant
        const createParticipant_Issue_Q_values = [req.user.person_id, createIssue_R.rows[0].issue_id, QueryConstant.PARTICIPANT_TYPE_REPORTER];
        const createParticipant_Issue_Q = `insert into participant_issue(participant_id, issue_id, participant_type) values($1,$2,$3);`;
        const createParticipant_Issue_R = await client.query(createParticipant_Issue_Q, createParticipant_Issue_Q_values);

        await client.query('commit');

        RequestUtil.append_request(req, {client, rows: createIssue_R.rows});
        ResponseUtil.setResponse(201, ResponseFlag.OK, createIssue_R.rows[0]);
        ResponseUtil.responds(res);
        next();
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
}, Issue_Middleware.log_post_middleware);

IssueRouter.get('/:id', async (req, res) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');
        let getIssue_Q_values = [id];
        const getIssue_Q = `select * from issue where issue_id=$1`;
        const getIssue_R = await client.query(getIssue_Q, getIssue_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getIssue_R.rows.length !== 0 ? getIssue_R.rows[0] : {});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

//my issues
IssueRouter.get('/', async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        await client.query('begin');
        let getIssues_Q_values = [req.user.person_id, paginator.limit, paginator.offset];
        const getIssues_Q = `select i.issue_id, i.parent_issue_id, i.project_id, i.issue_name,
                            i.issue_desc, i.issue_story_point, i.issue_type, i.issue_priority,
                            i.issue_status, i.reporter, i.created_date, i.updated_date
                            from issue i inner join participant_issue pi on 
                            i.issue_id = pi.issue_id and pi.participant_id = $1 and i.parent_issue_id is null 
                            limit $2 offset $3`;
        const getIssues_R = await client.query(getIssues_Q, getIssues_Q_values);

        //TODO: is not null = sub-task
        const getCount_Q = `select COUNT(*) from issue i inner join participant_issue pi on i.issue_id = pi.issue_id and pi.participant_id = $1 and i.parent_issue_id is null`;
        const getCount_R = await client.query(getCount_Q, [getIssues_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, {issues: getIssues_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

IssueRouter.put('/:id', IssueModel.sanitize_put_middleware, Issue_Middleware.log_put_middleware, async (req, res) => {
    const {id} = req.params;
    const {client} = req;
    try {
        await client.query('begin');

        //update issue
        const updateIssue_Q_values = [...req.put_ops.query_val, id];
        const updateIssue_Q = `update issue set ${req.put_ops.query_string} where issue_id=$${updateIssue_Q_values.length} returning *`;
        const updateIssue_R = await client.query(updateIssue_Q, updateIssue_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateIssue_R.rows.length === 0 ? {} : updateIssue_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

IssueRouter.delete('/:id', async (req, res) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');
        const query_values = [id];

        const deleteIssue_Q = `delete from issue where issue_id=$1 returning *`;
        const deleteIssue_R = await client.query(deleteIssue_Q, query_values);

        if (deleteIssue_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, issue: deleteIssue_R.rows});
        } else {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
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

IssueRouter.post('/assignee/:id', IssueModel.sanitize_post_assignee_middleware, async (req, res, next) => {
    const {id} = req.params;
    const client = await db.client();

    try {
        await client.query('begin');
        //create issue_participant
        const createParticipant_Issue_Q_values = [req.post_ops.query_val[0], id, QueryConstant.PARTICIPANT_TYPE_ASSIGNEE];
        const createParticipant_Issue_Q = `insert into participant_issue(participant_id, issue_id, participant_type) values($1,$2,$3) returning participant_id`;
        const createParticipant_Issue_R = await client.query(createParticipant_Issue_Q, createParticipant_Issue_Q_values);

        const getParticipant_Q_values = [createParticipant_Issue_R.rows[0].participant_id];
        const getParticipant_Q = `select * from person where person_id=$1`;
        const getParticipant_R = await client.query(getParticipant_Q, getParticipant_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getParticipant_R.rows.length === 0 ? {} : getParticipant_R.rows[0]);
        RequestUtil.append_request(req, {client, rows: createParticipant_Issue_R.rows});
        ResponseUtil.responds(res);
        next();
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
}, Issue_Middleware.log_post_assignee_middleware);

IssueRouter.delete('/assignee/:id', IssueModel.sanitize_delete_assignee_middleware, async (req, res, next) => {
    const {id} = req.params;
    const client = await db.client();
    try {
        await client.query('begin');
        //create issue_participant
        const createParticipant_Issue_Q_values = [req.delete_ops.query_val[0], parseInt(id), QueryConstant.PARTICIPANT_TYPE_ASSIGNEE];
        const createParticipant_Issue_Q = `delete from participant_issue where participant_id=$1 and issue_id=$2 and participant_type=$3 returning *`;
        const createParticipant_Issue_R = await client.query(createParticipant_Issue_Q, createParticipant_Issue_Q_values);

        await client.query('commit');
        if (createParticipant_Issue_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {
                deleted: true,
                assignee: createParticipant_Issue_R.rows[0]
            });
        } else {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
        }

        RequestUtil.append_request(req, {client});
        ResponseUtil.responds(res);
        next()
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
}, Issue_Middleware.log_delete_assignee_middleware);

//TODO: get all where task = req.params ?

//TODO get all issues belongs to this project

export default IssueRouter;
/*
epic #1
issue id = 1; parent issue id = null

issue #1 in epic #1
issue id = 2; parent issue id = 1;

sub task #1 in issue #1
issue id = 3; parent issue id = 2;

epic #2
issue id = 4; parent issue id = null;

update  issue #1 from epic #1 to epic #2
issue id = 2; parent issue id = 4;

 */
