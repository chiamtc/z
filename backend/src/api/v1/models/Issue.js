import Sanitizer from "../../../utils/Sanitizer";
import HttpResponse from "../../../utils/HttpResponse";
import ResponseFlag from "../../../constants/response_flag";
import QueryConstant from "../../../constants/query";
import db from "../../../db";

export default class Issue {
    constructor() {
    }

    sanitize_post_middleware(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const sanitizer = new Sanitizer();
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
        createIssue_ref.set('sprint_id', 'd');
        try {
            sanitizer.sanitize_reference = createIssue_ref;
            sanitizer.sanitize_request(req.body);
            req.post_ops = {...sanitizer.build_query('post')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    async log_post_middleware(req) {
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        try {
            const createHistory_Q_values = [req.user.person_id, rows[0].issue_id, QueryConstant.ISSUE_HISTORY_ACTION_CREATED];
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        } catch (e) {
            console.log(e);
        } finally {
            await client.release();
        }
    };

    sanitize_put_middleware(req,res,next){
        const SanitizerUtil = new Sanitizer();
        const updateIssue_ref = new Map();
        updateIssue_ref.set('issue_name', 's');
        updateIssue_ref.set('issue_type', 's');
        updateIssue_ref.set('issue_priority', 's');
        updateIssue_ref.set('issue_desc', 's');
        updateIssue_ref.set('issue_story_point', 'f');
        updateIssue_ref.set('issue_status', 's');
        updateIssue_ref.set('parent_issue_id', 'd');
        updateIssue_ref.set('sprint_id', 'd');
        updateIssue_ref.set('reporter', 'd');
        try {
            SanitizerUtil.sanitize_reference = updateIssue_ref;
            SanitizerUtil.sanitize_request(req.body);
            req.put_ops =  SanitizerUtil.build_query('put');
            req.log_ops = SanitizerUtil.build_query('post');
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    async log_put_middleware(req,res,next){
        const client = await db.client();
        const {id} = req.params;

        // create history regarding to issue update

        req.log_ops.query_string.split(',').map(async (str, i) => {
            const createHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, req.log_ops.query_val[i], str.trim(), id];
            const createHistory_Q = `insert into issue_history(issue_id, person_id, issue_history_action, new_content, old_content, updated_content_type)
                                select i.issue_id, $1, $2, $3, i.${str}, $4 from issue i where issue_id = $5`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        });
        req.client = client;
        next();
    }

    sanitize_post_assignee_middleware(req,res,next){
        const sanitizer = new Sanitizer();
        const ResponseUtil = new HttpResponse();

        const createAssignee_ref = new Map();
        createAssignee_ref.set('assignee', 'd');

        try {
            sanitizer.sanitize_reference = createAssignee_ref;
            sanitizer.sanitize_request(req.body);
            req.post_ops = {...sanitizer.build_query('post')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    async log_post_assignee_middleware(req,res){
        const SanitizerUtil = new Sanitizer();
        const {client} = req;
        const {id}  = req.params;
        //create history
        try {
            const createHistory_Q_values = [req.user.person_id, id, QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, null, req.post_ops.query_val[0], 'assignee'];
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, old_content, new_content, updated_content_type) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        }catch(e){
            console.log(e);
        }finally{
            await client.release();
        }
    }

    sanitize_delete_assignee_middleware(req,res,next){
        const sanitizer = new Sanitizer();

        const deleteAssignee_ref = new Map();
        deleteAssignee_ref.set('assignee', 'd');

        try {
            sanitizer.sanitize_reference = deleteAssignee_ref;
            sanitizer.sanitize_request(req.body);
            req.delete_ops = {...sanitizer.build_query('post')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    async log_delete_assignee_middleware(req,res){
        const SanitizerUtil = new Sanitizer();
        const {client} = req;
        const {id}  = req.params;
        //create history
        try {
            //create history
            const createHistory_Q_values = [req.user.person_id, id, QueryConstant.ISSUE_HISTORY_ACTION_REMOVED, null, req.delete_ops.query_val[0], 'assignee'];
            console.log(createHistory_Q_values)
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, old_content, new_content, updated_content_type) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
        }catch(e){
            console.log(e);
        }finally{
            await client.release();
        }
    }
}
