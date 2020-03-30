import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import db from "../../../../db";
import ResponseFlag from "../../../../constants/response_flag";
import {ErrorHandler} from "../../../../utils/ErrorHandler";
import HttpResponse from "../../../../utils/HttpResponse";

const ResponseUtil = new HttpResponse();
export default class CommentMiddleware {
    constructor() {
    }

    async log_delete_middleware(req, res) {
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        try {
            if (rows.length !== 0) {
                const createHistory_Q_values = [req.params.id, rows[0].issue_id, req.user.person_id, QueryConstant.COMMENT_HISTORY_ACTION_DELETED];
                const createHistory_Q = `insert into comment_history(comment_id, issue_id, person_id, comment_history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
                await client.query(createHistory_Q, createHistory_Q_values);
            }
        } catch (e) {
            console.log(e);
        } finally {
            await client.release();
        }
    }
}
