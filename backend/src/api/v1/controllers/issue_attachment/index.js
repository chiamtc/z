import Uploader from "../../models/storage/minio/minio/Uploader";
import ResponseFlag from "../../../../constants/response_flag";
import {Router} from "express";
import HttpResponse from "../../../../utils/HttpResponse";
import IssueAttachmentMiddleware from "../../middlewares/issue_attachment";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import MinioModel from "../../models/storage/minio/minio/MinioModel";
import HttpRequest from "../../../../utils/HttpRequest";

const IssueAttachmentRouter = Router();
const ResponseUtil = new HttpResponse();
const RequestUtil = new HttpRequest();
const IssueAttachment_Middleware = new IssueAttachmentMiddleware();

IssueAttachmentRouter.post('/:issueId', IssueAttachment_Middleware.get_bucket_subpath_name_based_on_comment, async (req, res, next) => {
    const client = await db.client();
    try {
        const uploader = new Uploader();
        const {buffer, file_path, file_name, mime_type, file_size} = await uploader.uploads('issues', req);

        const SanitizerUtil = new Sanitizer();
        await client.query('begin');
        const createIssueAttachment_Q_values = [req.params.issueId, file_path, file_name, mime_type, file_size];
        const createIssueAttachment_Q = `insert into issue_attachment(issue_id, file_path, file_name, mime_type, file_size)values(${SanitizerUtil.build_values(createIssueAttachment_Q_values)}) returning *`;
        const createIssueAttachment_R = await client.query(createIssueAttachment_Q, createIssueAttachment_Q_values);
        await client.query('commit');

        RequestUtil.append_request(req, {client, rows: createIssueAttachment_R.rows});
        ResponseUtil.setResponse(200, ResponseFlag.OK, {file: createIssueAttachment_R.rows[0], buffer});
        ResponseUtil.responds(res);
        next();
    } catch (e) {
        await client.query('rollback');
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
},IssueAttachment_Middleware.log_post_issue_attachment_middleware);

IssueAttachmentRouter.delete('/:id', IssueAttachment_Middleware.get_bucket_subpath_name_based_on_comment_attachment, async (req, res, next) => {
    const client = await db.client();
    try {
        const minioModel = new MinioModel();
        const ro = await minioModel.remove_object();
        await ro('issues', req.issue_attachment_object.file_path);

        await client.query('begin');
        const deleteCommentAttachment_Q_values = [req.params.id];
        console.log(deleteCommentAttachment_Q_values)
        const deleteCommentAttachment_Q = `delete from issue_attachment where issue_attachment_id=$1 returning *`;
        const deleteCommentAttachment_R = await client.query(deleteCommentAttachment_Q, deleteCommentAttachment_Q_values);
        await client.query('commit');
        RequestUtil.append_request(req, {client, rows: deleteCommentAttachment_R.rows});
        ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, file: deleteCommentAttachment_R.rows[0]});
        ResponseUtil.responds(res);
        next();
    } catch (e) {
        console.log('e', e);
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
}, IssueAttachment_Middleware.log_delete_issue_attachment_middleware);

export default IssueAttachmentRouter;
