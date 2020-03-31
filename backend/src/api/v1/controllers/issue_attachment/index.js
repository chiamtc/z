import Uploader from "../../models/storage/minio/minio/Uploader";
import ResponseFlag from "../../../../constants/response_flag";
import {Router} from "express";
import HttpResponse from "../../../../utils/HttpResponse";
import IssueAttachmentMiddleware from "../../middlewares/issue_attachment";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import MinioModel from "../../models/storage/minio/minio/MinioModel";
import HttpRequest from "../../../../utils/HttpRequest";
import Paginator from "../../../../utils/Paginator";

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
        ResponseUtil.setResponse(200, ResponseFlag.OK, {file: createIssueAttachment_R.rows[0]});
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

IssueAttachmentRouter.get('/files/:id', async (req, res) => {
    const client = await db.client();
    try {
        const getIssueAttachment_Q_values = [req.params.id];
        const getIssueAttachment_Q = `select * from issue_attachment where issue_attachment_id=$1`;
        const getIssueAttachment_R = await client.query(getIssueAttachment_Q, getIssueAttachment_Q_values);

        if (getIssueAttachment_R.rows.length !== 0) {
            const {file_path, file_name, mime_type, file_size} = getIssueAttachment_R.rows[0];
            const minioModel = new MinioModel();
            const {buffer} = await minioModel.get_object("issues", file_path, file_name, mime_type, file_size);
            ResponseUtil.setResponse(200, mime_type, buffer);
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {});
        ResponseUtil.respondsWithBuffer(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

IssueAttachmentRouter.get('/details/:id', async (req, res) => {
    const client = await db.client();
    try {

        const getIssueAttachment_Q_values = [req.params.id];
        const getIssueAttachment_Q = `select * from issue_attachment where issue_attachment_id=$1`;
        const getIssueAttachment_R = await client.query(getIssueAttachment_Q, getIssueAttachment_Q_values);

        ResponseUtil.setResponse(200, ResponseFlag.OK, {fileDetails: getIssueAttachment_R.rows.length !== 0 ? getIssueAttachment_R.rows[0] : {}});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

IssueAttachmentRouter.get('/details/issues/:issueId', async (req, res) => {
    const client = await db.client();

    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        const getIssueAttachment_Q_values = [req.params.issueId,paginator.limit, paginator.offset];
        const getIssueAttachment_Q = `select * from issue_attachment where issue_id=$1 limit $2 offset $3`;
        const getIssueAttachment_R = await client.query(getIssueAttachment_Q, getIssueAttachment_Q_values);

        const getCount_Q = `select COUNT(*) from issue_attachment where issue_id=$1`;
        const getCount_R = await client.query(getCount_Q, [getIssueAttachment_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        ResponseUtil.setResponse(200, ResponseFlag.OK, {fileDetails: getIssueAttachment_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

export default IssueAttachmentRouter;
