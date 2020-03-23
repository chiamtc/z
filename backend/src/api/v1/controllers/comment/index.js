import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpRequest from "../../../../utils/HttpRequest";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";
import Comment from '../../models/Comment'
import CommentMiddleware from '../../middlewares/comment';

const CommentRouter = Router();
const RequestUtil = new HttpRequest();
const ResponseUtil = new HttpResponse();
const CommentModel = new Comment();
const Comment_Middleware = new CommentMiddleware();

CommentRouter.post('/', authenticate_jwtStrategy, CommentModel.sanitize_post_middleware, async (req, res) => {
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();
    try {
        await client.query('begin');
        //create comment
        const createComment_Q = `insert into comment (${req.post_ops.query_string}) values (${SanitizerUtil.build_values(req.post_ops.query_val)}) returning *`;
        const createComment_R = await client.query(createComment_Q, req.post_ops.query_val);
        await client.query('commit');
        ResponseUtil.setResponse(201, ResponseFlag.OK, createComment_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

CommentRouter.put('/:id', authenticate_jwtStrategy, CommentModel.sanitize_put_middleware, async (req, res) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');

        //update comment
        const updateComment_Q_values = [...req.put_ops.query_val, true, id];
        const updateComment_Q = `update comment set ${req.put_ops.query_string}, edited=$2 where comment_id=$3 returning *`;
        const updateComment_R = await client.query(updateComment_Q, updateComment_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateComment_R.rows.length === 0 ? {} : updateComment_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

CommentRouter.delete('/:id', authenticate_jwtStrategy, async (req, res, next) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');

        //delete comment
        const deleteComment_Q_values = [id];
        const deleteComment_Q = `delete from comment where comment_id=$1 returning *`;
        const deleteComment_R = await client.query(deleteComment_Q, deleteComment_Q_values);
        await client.query('commit');

        if (deleteComment_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, comment: deleteComment_R.rows[0]});
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
        RequestUtil.append_request(req, {client, rows: deleteComment_R.rows});
        ResponseUtil.responds(res);
        next();
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
}, Comment_Middleware.log_delete_middleware);

CommentRouter.get('/issues/:issueId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        const {issueId} = req.params;
        await client.query('begin');
        //get issue comment
        const getIssueComment_Q_values = [issueId, paginator.limit, paginator.offset];
        //TODO: need a regression with join statement to get fn + ln
        const getIssueComment_Q = `select * from comment where issue_id=$1 limit $2 offset $3`;
        const getIssueComment_R = await client.query(getIssueComment_Q, getIssueComment_Q_values);

        //get total count
        const getCount_Q = `select COUNT(*) from comment where issue_id=$1`;
        const getCount_R = await client.query(getCount_Q, [getIssueComment_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getIssueComment_R.rows.length === 0 ? {} : {
            comments: getIssueComment_R.rows,
            has_more,
            total_count
        });
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default CommentRouter;
