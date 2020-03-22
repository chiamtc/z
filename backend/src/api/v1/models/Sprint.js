import HttpResponse from "../../../utils/HttpResponse";
import Sanitizer from "../../../utils/Sanitizer";
import ResponseFlag from "../../../constants/response_flag";

export default class Sprint {
    constructor() {

    }

    sanitize_post_sanitizer(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const sanitizer = new Sanitizer();
        const createSprint_ref = new Map();
        createSprint_ref.set('sprint_name', 's');
        createSprint_ref.set('sprint_goal', 's');
        createSprint_ref.set('start_date', 's');
        createSprint_ref.set('end_date', 's');
        createSprint_ref.set('project_id', 'd');

        try {
            sanitizer.sanitize_reference = createSprint_ref;
            sanitizer.sanitize_request(req.body);
            req.post_ops = {...sanitizer.build_query('post')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    sanitize_put_sanitizer(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const SanitizerUtil = new Sanitizer();

        const updateSprint_ref = new Map();
        updateSprint_ref.set('sprint_name', 's');
        updateSprint_ref.set('sprint_goal', 's');
        updateSprint_ref.set('start_date', 's');
        updateSprint_ref.set('end_date', 's');

        try {
            SanitizerUtil.sanitize_reference = updateSprint_ref;
            SanitizerUtil.sanitize_request(req.body);
            req.put_ops = {...SanitizerUtil.build_query('put')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }
}
