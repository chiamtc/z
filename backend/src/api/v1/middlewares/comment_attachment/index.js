import db from "../../../../db";
import ResponseFlag from "../../../../constants/response_flag";
import {ErrorHandler} from "../../../../utils/ErrorHandler";
import HttpResponse from "../../../../utils/HttpResponse";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";

const ResponseUtil = new HttpResponse();
export default class CommentAttachmentMiddleware {
    constructor() {
    }

    async get_bucket_subpath_name_based_on_comment(req, res, next) {
        const client = await db.client();
        const {commentId} = req.params;
        try {
            const getBucket_Q_values = [commentId];
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

    async get_bucket_subpath_name_based_on_comment_attachment(req, res, next) {
        const client = await db.client();
        const {id} = req.params;
        try {
            const getBucket_Q_values = [id];
            const getBucket_Q = `select * from comment_attachment where comment_attachment_id=$1`;
            const getBucket_R = await client.query(getBucket_Q, getBucket_Q_values);

            if (getBucket_R.rows.length !== 0) {
                req.comment_attachment_object = getBucket_R.rows[0];
                next();
            } else throw new ErrorHandler(500, ResponseFlag.OBJECT_NOT_FOUND, 'No such file exists');
        } catch (e) {
            console.log(e);
            ResponseUtil.setResponse(500, ResponseFlag.OBJECT_NOT_FOUND, `Storage Error: ${e.message}.`);
            ResponseUtil.responds(res);
        }
    }

    //not using atm
    async post_upload_middleware(req, res) {
        const client = await db.client();
        const SanitizerUtil = new Sanitizer();
        try {
            await client.query('begin');
            const createCommentAttachment_Q_values = [req.params.commentId, req.file_name];
            const createCommentAttachment_Q = `insert into comment_attachment(comment_id, file_name)values($1,$2) returning *`;
            const createCommentAttachment_R = await client.query(createCommentAttachment_Q, createCommentAttachment_Q_values);
            await client.query('commit');
            console.log(createCommentAttachment_R.rows[0]);
        } catch (e) {
            await client.query('rollback');
            console.log(e);
        } finally {
            await client.release();
        }
    }

}
