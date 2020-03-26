import HttpResponse from "../../../utils/HttpResponse";
import Sanitizer from "../../../utils/Sanitizer";
import ResponseFlag from "../../../constants/response_flag";

export default class Role {
    constructor() {

    }

    sanitize_put_middleware(req, res, next) {
        const ResponseUtil = new HttpResponse();
        const SanitizerUtil = new Sanitizer();
        const updateRole_ref = new Map();
        updateRole_ref.set('role_name', 's');
        updateRole_ref.set('description', 's');
        try {
            SanitizerUtil.sanitize_reference = updateRole_ref;
            SanitizerUtil.sanitize_request(req.body);
            req.put_ops = {...SanitizerUtil.build_query('put')};
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
    }

    enum_to_array(enum_str) {
        return enum_str.slice(1, enum_str.length - 1).split(",");
    }
}
