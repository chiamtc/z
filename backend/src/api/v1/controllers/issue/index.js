import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import Paginator from "../../../../utils/Paginator";

const IssueRouter = Router();

const ResponseUtil = new HttpResponse();

IssueRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createIssue_ref = new Map();
    createIssue_ref.set('issue_name', 's');
    createIssue_ref.set('issue_type', 's');
    createIssue_ref.set('issue_desc', 's');
    createIssue_ref.set('issue_story_point', 'f');
    createIssue_ref.set('issue_priority', 's');
    createIssue_ref.set('issue_status', 's');
    createIssue_ref.set('parent_issue_id', 'd');
    createIssue_ref.set('project_id', 'd');
    createIssue_ref.set('reporter', 'd');
    createIssue_ref.set('sprint_id', 'd'); //TODO: uncomment when doing sprint

    try {
        SanitizerUtil.sanitize_reference = createIssue_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }
    try {
        await client.query('begin');

        //create issue
        const createIssue_Q = `insert into issue(${f.query_string}) values (${SanitizerUtil.build_values(f.query_val)}) returning *`;
        const createIssue_R = await client.query(createIssue_Q, f.query_val);

        //create issue_participant
        const createParticipant_Issue_Q_values = [req.user.person_id, createIssue_R.rows[0].issue_id, QueryConstant.PARTICIPANT_TYPE_REPORTER];
        const createParticipant_Issue_Q = `insert into participant_issue(participant_id, issue_id, participant_type) values($1,$2,$3);`;
        const createParticipant_Issue_R = await client.query(createParticipant_Issue_Q, createParticipant_Issue_Q_values);

        //create history
        const {rows} = createIssue_R;
        const createHistory_Q_values = [req.user.person_id, rows[0].issue_id, QueryConstant.ISSUE_HISTORY_ACTION_CREATED];
        const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
        const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(201, ResponseFlag.OK, createIssue_R.rows[0]);
        ResponseUtil.responds(res);

    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

IssueRouter.get('/:id', authenticate_jwtStrategy, async (req, res) => {
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
IssueRouter.get('/', authenticate_jwtStrategy, async (req, res) => {
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

IssueRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f, h;
    const client = await db.client();
    const {id} = req.params;
    const SanitizerUtil = new Sanitizer();
    const updateIssue_ref = new Map();
    updateIssue_ref.set('issue_name', 's');
    updateIssue_ref.set('issue_type', 's');
    updateIssue_ref.set('issue_priority', 's');
    updateIssue_ref.set('issue_desc', 's');
    updateIssue_ref.set('issue_story_point', 'f');
    updateIssue_ref.set('issue_status', 's');
    updateIssue_ref.set('parent_issue_id', 'd'); //TODO: move function. aka move current sub task id to another task
    updateIssue_ref.set('sprint_id', 'd'); //TODO: uncomment when doing sprint
    updateIssue_ref.set('reporter', 'd'); //TODO: uncomment when doing sprint
    try {
        SanitizerUtil.sanitize_reference = updateIssue_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
        h = SanitizerUtil.build_query('post');

    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');

        // create history regarding to issue update
        h.query_string.split(',').map(async (str, i) => {
            const createHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, h.query_val[i], str.trim(), id];
            const createHistory_Q = `insert into issue_history(issue_id, person_id, issue_history_action, new_content, old_content, updated_content_type)
                                select i.issue_id, $1, $2, $3, i.${str}, $4 from issue i where issue_id = $5`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        });

        //update issue
        const updateIssue_Q_values = [...f.query_val, id];
        const updateIssue_Q = `update issue set ${f.query_string} where issue_id=$${updateIssue_Q_values.length} returning *`;
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

IssueRouter.delete('/:id', authenticate_jwtStrategy, async (req, res) => {
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

//TODO: deprecates
IssueRouter.put('/reporter/:id', authenticate_jwtStrategy, async (req, res) => {
    let f, h;
    const client = await db.client();
    const {id} = req.params;
    const SanitizerUtil = new Sanitizer();
    const updateReporter_ref = new Map();
    updateReporter_ref.set('reporter', 'd');
    try {
        SanitizerUtil.sanitize_reference = updateReporter_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
        h = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }
    try {
        await client.query('begin');

        // create history regarding to issue update
        h.query_string.split(',').map(async (str, i) => {
            const createHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, h.query_val[i], str.trim(), id];
            const createHistory_Q = `insert into issue_history(issue_id, person_id, issue_history_action, new_content, old_content, updated_content_type)
                                select i.issue_id, $1, $2, $3, i.${str}, $4 from issue i where issue_id = $5`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        });

        //update participant_issue
        const updateParticipantIssue_Q_values = [f.query_val[0], id];
        const updateParticipantIssue_Q = `update participant_issue set participant_id=$1 where issue_id=$2 and participant_type = 'reporter'`;
        const updateParticipantIssue_R = await client.query(updateParticipantIssue_Q, updateParticipantIssue_Q_values);

        //update issue
        const updateIssue_Q_values = [f.query_val[0], id];
        const updateIssue_Q = `update issue set reporter=$1 where issue_id=$2 returning *`;
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

IssueRouter.post('/assignee/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const {id} = req.params;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createAssignee_ref = new Map();
    createAssignee_ref.set('assignee', 'd');
    // updateMe_ref.set('sprint_id', 'd'); //TODO: uncomment when doing sprint

    try {
        SanitizerUtil.sanitize_reference = createAssignee_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }
    try {
        await client.query('begin');

        //create issue_participant
        const createParticipant_Issue_Q_values = [f.query_val[0], id, QueryConstant.PARTICIPANT_TYPE_ASSIGNEE];
        const createParticipant_Issue_Q = `insert into participant_issue(participant_id, issue_id, participant_type) values($1,$2,$3) returning participant_id`;
        const createParticipant_Issue_R = await client.query(createParticipant_Issue_Q, createParticipant_Issue_Q_values);

        const getParticipant_Q_values = [createParticipant_Issue_R.rows[0].participant_id];
        const getParticipant_Q = `select * from person where person_id=$1`;
        const getParticipant_R = await client.query(getParticipant_Q, getParticipant_Q_values);

        //create history
        const createHistory_Q_values = [req.user.person_id, id, QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, null, f.query_val[0], 'assignee'];
        const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, old_content, new_content, updated_content_type) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
        const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getParticipant_R.rows.length === 0 ? {} : getParticipant_R.rows[0]);
        ResponseUtil.responds(res);

    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

IssueRouter.delete('/assignee/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const {id} = req.params;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createAssignee_ref = new Map();
    createAssignee_ref.set('assignee', 'd');
    // updateMe_ref.set('sprint_id', 'd'); //TODO: uncomment when doing sprint

    try {
        SanitizerUtil.sanitize_reference = createAssignee_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }
    try {
        await client.query('begin');

        //create issue_participant
        const createParticipant_Issue_Q_values = [f.query_val[0], id, QueryConstant.PARTICIPANT_TYPE_ASSIGNEE];
        const createParticipant_Issue_Q = `delete from participant_issue where participant_id=$1 and issue_id=$2 and participant_type=$3 returning *`;
        const createParticipant_Issue_R = await client.query(createParticipant_Issue_Q, createParticipant_Issue_Q_values);

        //get deleted participant
        const getParticipant_Q_values = [createParticipant_Issue_R.rows[0].participant_id];
        const getParticipant_Q = `select * from person where person_id=$1`;
        const getParticipant_R = await client.query(getParticipant_Q, getParticipant_Q_values);

        //create history
        const createHistory_Q_values = [req.user.person_id, id, QueryConstant.ISSUE_HISTORY_ACTION_REMOVED, null, f.query_val[0], 'assignee'];
        const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, old_content, new_content, updated_content_type) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
        const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);

        await client.query('commit');
        if (createParticipant_Issue_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, assignee: getParticipant_R.rows[0]});
        } else {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
        }

        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

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
