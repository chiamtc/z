import db from "../../../../db";
import ResponseFlag from "../../../../constants/response_flag";
import {ErrorHandler} from "../../../../utils/ErrorHandler";
import HttpResponse from "../../../../utils/HttpResponse";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";

const ResponseUtil = new HttpResponse();
export default class IssueAttachmentMiddleware {
    constructor() {
    }

    async get_bucket_subpath_name_based_on_comment(req, res, next) {
        const client = await db.client();
        const {issueId} = req.params;
        try {
            const getBucket_Q_values = [issueId];
            const getBucket_Q = `select project_id from issue where issue_id=$1`;
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

    async get_bucket_subpath_name_based_on_comment_attachment(req, res, next) {
        const client = await db.client();
        const {id} = req.params;
        try {
            const getBucket_Q_values = [id];
            console.log(getBucket_Q_values)
            const getBucket_Q = `select * from issue_attachment where issue_attachment_id=$1`;
            const getBucket_R = await client.query(getBucket_Q, getBucket_Q_values);

            if (getBucket_R.rows.length !== 0) {
                req.issue_attachment_object = getBucket_R.rows[0];
                next();
            } else throw new ErrorHandler(500, ResponseFlag.OBJECT_NOT_FOUND, 'No such file exists');
        } catch (e) {
            console.log(e);
            ResponseUtil.setResponse(500, ResponseFlag.OBJECT_NOT_FOUND, `Storage Error: ${e.message}.`);
            ResponseUtil.responds(res);
        }
    }

    async log_post_issue_attachment_middleware(req, res) {
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        try {
            const createHistory_Q_values = [req.user.person_id, rows[0].issue_id, QueryConstant.ISSUE_HISTORY_ACTION_ADDED, rows[0].file_name];
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, new_content) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            await client.query(createHistory_Q, createHistory_Q_values);
        } catch (e) {
            console.log(e);
        } finally {
            await client.release();
        }
    }

    async log_delete_issue_attachment_middleware(req, res) {
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        try {
            const createHistory_Q_values = [req.user.person_id, rows[0].issue_id, QueryConstant.ISSUE_HISTORY_ACTION_REMOVED, null, rows[0].file_name];
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, new_content, old_content) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            await client.query(createHistory_Q, createHistory_Q_values);
        } catch (e) {
            console.log(e);
        } finally {
            await client.release();
        }
    }
}
