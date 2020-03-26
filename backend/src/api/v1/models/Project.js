import HttpResponse from "../../../utils/HttpResponse";
import Sanitizer from "../../../utils/Sanitizer";
import ResponseFlag from "../../../constants/response_flag";

export default class Project {
    constructor() {

    }

    sanitize_put_middleware(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const SanitizerUtil = new Sanitizer();
        const updateProject_ref = new Map();
        updateProject_ref.set('project_name', 's');
        updateProject_ref.set('project_desc', 's');
        updateProject_ref.set('project_lead', 'd');
        try {
            SanitizerUtil.sanitize_reference = updateProject_ref;
            SanitizerUtil.sanitize_request(req.body);
            req.put_ops = {...SanitizerUtil.build_query('put')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    sanitize_post_middleware(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const sanitizer = new Sanitizer();
        const createProject_ref = new Map();
        createProject_ref.set('project_name', 's');
        createProject_ref.set('project_type', 's');
        createProject_ref.set('project_desc', 's');
        createProject_ref.set('project_lead', 'd');
        try {
            sanitizer.sanitize_reference = createProject_ref;
            sanitizer.sanitize_request(req.body);
            req.post_ops = {...sanitizer.build_query('post')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }
}
