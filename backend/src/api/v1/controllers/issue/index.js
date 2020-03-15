import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import HttpRequest from "../../../../utils/HttpRequest";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import Paginator from "../../../../utils/Paginator";

const IssueRouter = Router();

const ResponseUtil = new HttpResponse();
const RequestUtil = new HttpRequest();

IssueRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const updateMe_ref = new Map();
    updateMe_ref.set('issue_name', 's');
    updateMe_ref.set('issue_type', 's');
    updateMe_ref.set('issue_desc', 's');
    updateMe_ref.set('issue_story_point', 'f');
    updateMe_ref.set('issue_priority', 's');
    updateMe_ref.set('issue_status', 's');
    updateMe_ref.set('parent_issue_id', 'd');
    updateMe_ref.set('project_id', 'd');
    updateMe_ref.set('reporter', 'd');

    try {
        SanitizerUtil.sanitize_reference = updateMe_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: ${e.message}`);
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
        const createHistory_Q_values = [req.user.person_id, rows[0].issue_id, QueryConstant.HISTORY_ACTION_CREATED];
        const createHistory_Q = `insert into history(person_id, issue_id, history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
        const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, createIssue_R.rows[0]);
        ResponseUtil.responds(res);

    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

IssueRouter.get('/reported', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        await client.query('begin');
        let getIssues_Q_values = [req.user.person_id, paginator.limit, paginator.offset];
        const getIssues_Q = `select * from issue i inner join participant_issue pi on i.issue_id = pi.issue_id and pi.participant_id = $1 and i.parent_issue_id is null limit $2 offset $3`;
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
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

IssueRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
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
    // updateIssue_ref.set('sprint_id', 'd');
    updateIssue_ref.set('reporter', 'd');
    try {
        SanitizerUtil.sanitize_reference = updateIssue_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
        console.log(f);
        console.log(SanitizerUtil.build_query('post'));
        /*
        const history_Q_val = [
         INSERT INTO history (issue_id, person_id, history_action, new_content, old_content)
         SELECT issue_id, 2, 'updated', 'new issue name', issue_name
         FROM  issue  WHERE  issue_id = i
         */
        // const updateIssue_Q_values = [...f.query_val, id]
        // const updateIssue_Q = `update issue set ${f.query_string} where issue_id=$${updateIssue_Q_values.length} returning *`;
        // const updateIssue_R = await client.query(updateIssue_Q, updateIssue_Q_values);
        ResponseUtil.setResponse(200, ResponseFlag.OK, 'ok');//updateIssue_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});
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
