import HttpResponse from "../../../utils/HttpResponse";
import Sanitizer from "../../../utils/Sanitizer";
import ResponseFlag from "../../../constants/response_flag";
import QueryConstant from "../../../constants/query";

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

    async log_delete_middleware(req,res){
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        try {
            if(rows.length !== 0) {
                const createHistory_Q_values = [req.params.id, rows[0].issue_id, req.user.person_id, QueryConstant.COMMENT_HISTORY_ACTION_DELETED];
                const createHistory_Q = `insert into comment_history(comment_id, issue_id, person_id, comment_history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
                const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
            }
        } catch (e) {
            console.log(e);
        } finally {
            await client.release();
        }
    }
}
