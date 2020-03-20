import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import Paginator from "../../../../utils/Paginator";

const CommentRouter = Router();

const ResponseUtil = new HttpResponse();

CommentRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createComment_ref = new Map();
    createComment_ref.set('content', 's');
    createComment_ref.set('person_id', 'd');
    createComment_ref.set('issue_id', 'd');

    try {
        SanitizerUtil.sanitize_reference = createComment_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        //create comment
        const createComment_Q = `insert into comment (${f.query_string}) values (${SanitizerUtil.build_values(f.query_val)}) returning *`;
        const createComment_R = await client.query(createComment_Q, f.query_val);
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

CommentRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createComment_ref = new Map();
    createComment_ref.set('content', 's');

    try {
        SanitizerUtil.sanitize_reference = createComment_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }
    try {
        const {id} = req.params;
        await client.query('begin');

        //update comment
        const updateComment_Q_values = [...f.query_val, true, id];
        const updateComment_Q = `update comment set ${f.query_string}, edited=$2 where comment_id=$3 returning *`;
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

CommentRouter.delete('/:id', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();
    try {
        const {id} = req.params;
        const {person_id} = req.user;
        await client.query('begin');

        //delete comment
        const deleteComment_Q_values = [id];
        const deleteComment_Q = `delete from comment where comment_id=$1 returning *`;
        const deleteComment_R = await client.query(deleteComment_Q, deleteComment_Q_values);

        if (deleteComment_R.rows.length !== 0) {
            const createHistory_Q_values = [id, deleteComment_R.rows[0].issue_id, person_id, QueryConstant.COMMENT_HISTORY_ACTION_DELETED];
            const createHistory_Q = `insert into comment_history(comment_id, issue_id, person_id, comment_history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);

            await client.query('commit');
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, comment: deleteComment_R.rows[0]});
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

CommentRouter.get('/:issueId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        const {issueId} = req.params;
        await client.query('begin');
        //get issue comment
        const getIssueComment_Q_values = [issueId, paginator.limit, paginator.offset];
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
