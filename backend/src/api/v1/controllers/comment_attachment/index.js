import Uploader from "../../models/storage/minio/minio/Uploader";
import ResponseFlag from "../../../../constants/response_flag";
import {Router} from "express";
import HttpResponse from "../../../../utils/HttpResponse";
import CommentAttachmentMiddleware from "../../middlewares/comment_attachment";
import MinioModel from "../../models/storage/minio/minio/MinioModel";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";

const CommentAttachmentRouter = Router();
const ResponseUtil = new HttpResponse();
const CommentAttachment_Middleware = new CommentAttachmentMiddleware();

CommentAttachmentRouter.post('/:commentId', CommentAttachment_Middleware.get_bucket_subpath_name_based_on_comment, async (req, res, next) => {
    const client = await db.client();
    try {
        const uploader = new Uploader();
        const {buffer, file_path, file_name, mime_type, file_size} = await uploader.uploads('comments', req);

        const SanitizerUtil = new Sanitizer();
        await client.query('begin');
        const createCommentAttachment_Q_values = [req.params.commentId, file_path, file_name, mime_type, file_size];
        const createCommentAttachment_Q = `insert into comment_attachment(comment_id, file_path, file_name, mime_type, file_size)values(${SanitizerUtil.build_values(createCommentAttachment_Q_values)}) returning *`;
        const createCommentAttachment_R = await client.query(createCommentAttachment_Q, createCommentAttachment_Q_values);
        await client.query('commit');

        ResponseUtil.setResponse(200, ResponseFlag.OK, {file: createCommentAttachment_R.rows[0]});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

CommentAttachmentRouter.delete('/:id', CommentAttachment_Middleware.get_bucket_subpath_name_based_on_comment_attachment, async (req, res, next) => {
    const client = await db.client();
    try {
        const minioModel = new MinioModel();
        const ro = await minioModel.remove_object();
        await ro('comments', req.comment_attachment_object.file_path);

        await client.query('begin');
        const deleteCommentAttachment_Q_values = [req.params.id];
        const deleteCommentAttachment_Q = `delete from comment_attachment where comment_attachment_id=$1 returning *`;
        const deleteCommentAttachment_R = await client.query(deleteCommentAttachment_Q, deleteCommentAttachment_Q_values);
        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, file: deleteCommentAttachment_R.rows[0]});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

CommentAttachmentRouter.get('/files/:id', async (req, res) => {
    const client = await db.client();
    try {

        const getCommentAttachment_Q_values = [req.params.id];
        const getCommentAttachment_Q = `select * from comment_attachment where comment_attachment_id=$1`;
        const getCommentAttachment_R = await client.query(getCommentAttachment_Q, getCommentAttachment_Q_values);

        if (getCommentAttachment_R.rows.length !== 0) {
            const {file_path, file_name, mime_type, file_size} = getCommentAttachment_R.rows[0];
            const minioModel = new MinioModel();
            const {buffer} = await minioModel.get_object("comments", file_path, file_name, mime_type, file_size);
            ResponseUtil.setResponse(200, mime_type, buffer);
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {});
        ResponseUtil.respondsWithBuffer(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

CommentAttachmentRouter.get('/details/:id', async (req, res) => {
    const client = await db.client();
    try {

        const getCommentAttachment_Q_values = [req.params.id];
        const getCommentAttachment_Q = `select * from comment_attachment where comment_attachment_id=$1`;
        const getCommentAttachment_R = await client.query(getCommentAttachment_Q, getCommentAttachment_Q_values);

        ResponseUtil.setResponse(200, ResponseFlag.OK, {fileDetails: getCommentAttachment_R.rows.length !== 0 ? getCommentAttachment_R.rows[0] : {}});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

CommentAttachmentRouter.get('/details/comments/:commentId', async (req, res) => {
    const client = await db.client();

    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        const getCommentAttachment_Q_values = [req.params.commentId, paginator.limit, paginator.offset];
        const getCommentAttachment_Q = `select * from comment_attachment where comment_id=$1 limit $2 offset $3`;
        const getCommentAttachment_R = await client.query(getCommentAttachment_Q, getCommentAttachment_Q_values);

        const getCount_Q = `select COUNT(*) from comment_attachment where comment_id=$1`;
        const getCount_R = await client.query(getCount_Q, [getCommentAttachment_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        ResponseUtil.setResponse(200, ResponseFlag.OK, {
            fileDetails: getCommentAttachment_R.rows,
            total_count,
            has_more
        });
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

//TODO paginator and /files/comments/:commentId ?
/*
reconstruct buffer to actual iamge
 var arraybufferview = new Uint8Array([137,80,...]);
 const blob = new Blob(
 [arraybufferview], {type:'image/png'});

const url = window.URL.createObjectURL(blob);
console.log(url)
const img = document.getElementById('i');
img.src = url;
 */
export default CommentAttachmentRouter;
