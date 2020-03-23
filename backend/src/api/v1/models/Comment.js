import HttpResponse from "../../../utils/HttpResponse";
import Sanitizer from "../../../utils/Sanitizer";
import ResponseFlag from "../../../constants/response_flag";

export default class Comment {
    constructor() {
    }

    sanitize_post_middleware(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const SanitizerUtil = new Sanitizer();
        const createComment_ref = new Map();
        createComment_ref.set('content', 's');
        createComment_ref.set('person_id', 'd');
        createComment_ref.set('issue_id', 'd');

        try {
            SanitizerUtil.sanitize_reference = createComment_ref;
            SanitizerUtil.sanitize_request(req.body);
            req.post_ops = {...SanitizerUtil.build_query('post')};
            next()
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    sanitize_put_middleware(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const SanitizerUtil = new Sanitizer();
        const updateComment_ref = new Map();
        updateComment_ref.set('content', 's');
        try {
            SanitizerUtil.sanitize_reference = updateComment_ref;
            SanitizerUtil.sanitize_request(req.body);
            req.put_ops = {...SanitizerUtil.build_query('put')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }
}
