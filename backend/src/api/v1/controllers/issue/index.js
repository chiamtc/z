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
        const createParticipant_Issue_Q_values = [req.user.person_id, createIssue_R.rows[0].issue_id];
        const createParticipant_Issue_Q = `insert into participant_issue(participant_id, issue_id) values($1,$2);`;
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

IssueRouter.get('/', authenticate_jwtStrategy, async (req, res) => {
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
export default IssueRouter;
