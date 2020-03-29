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

    async get_bucket_subpath_name(req, res, next) {
        const client = await db.client();
        const {id} = req.params;
        try {
            const getBucket_Q_values = [id];
            const getBucket_Q = `select project_id from project where project_id = (select project_id from issue where issue_id = (select issue_id from comment where comment_id=$1));`;
            const getBucket_R = await client.query(getBucket_Q, getBucket_Q_values);

            if (getBucket_R.rows.length !== 0) {
                req.bucket_path = getBucket_R.rows[0].project_id;
                next();
            } else throw new ErrorHandler(500, ResponseFlag.OBJECT_NOT_FOUND, 'No such project id exists');
        } catch (e) {
            console.log(e);
            ResponseUtil.setResponse(500, ResponseFlag.OBJECT_NOT_FOUND, `Storage Error: ${e.message}.`);
            ResponseUtil.responds(res);
        }

    }
}
