import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse_Utils from "../../../../utils/HttpResponse_Utils";
import HttpRequest_Utils from "../../../../utils/HttpRequest_Utils";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";

const IssueRouter = Router();

const ResponseUtil = new HttpResponse_Utils();
const RequestUtil = new HttpRequest_Utils();

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

        //TODO: create issue_participant

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

export default IssueRouter;
