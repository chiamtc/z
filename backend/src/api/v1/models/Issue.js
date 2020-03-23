import Sanitizer from "../../../utils/Sanitizer";
import HttpResponse from "../../../utils/HttpResponse";
import ResponseFlag from "../../../constants/response_flag";

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
}
