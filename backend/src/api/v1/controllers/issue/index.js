import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse_Utils from "../../../../utils/HttpResponse_Utils";
import HttpRequest_Utils from "../../../../utils/HttpRequest_Utils";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";

const IssueRouter = Router();

const ResponseUtil = new HttpResponse_Utils();
const RequestUtil = new HttpRequest_Utils();

IssueRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    let insert_val = '';
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const updateMe_ref = new Map();
    updateMe_ref.set('issue_name', 'issue_name');
    updateMe_ref.set('issue_type', 'issue_type');
    updateMe_ref.set('issue_priority', 'issue_priority');
    updateMe_ref.set('issue_status', 'issue_status');

    try {
        SanitizerUtil.sanitize_reference = updateMe_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_create_query();

        const project_id = parseInt(req.body.project_id);
        const assignee = req.body['assignee'] !== undefined ? parseInt(req.body.assignee) : null;

        f.query_string = `${f.query_string}, project_id, reporter`;
        f.query_val = [...f.query_val, project_id, req.user.person_id];
        if (assignee !== null) {
            f.query_string = `${f.query_string}, assignee`;
            f.query_val.push(assignee);
        }
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        f.query_val.map((e, i) => insert_val += i === f.query_val.length - 1 ? `$${i + 1}` : `$${i + 1}, `);
        const createIssue_Q = `insert into issue(${f.query_string}) values (${insert_val}) returning *`;
        const createIssue_R = await client.query(createIssue_Q, f.query_val);
        ResponseUtil.setResponse(200, ResponseFlag.OK, createIssue_R.rows[0]);
        ResponseUtil.responds(res);

    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }finally{
        await client.release();
    }

});

export default IssueRouter;
