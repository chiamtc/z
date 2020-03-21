import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import Paginator from "../../../../utils/Paginator";

const CommentHistoryRouter = Router();

const ResponseUtil = new HttpResponse();

CommentHistoryRouter.get('/issues/:issueId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);
    const {issueId} = req.params;
    try {
        await client.query('begin');
        let getIssueHistory_Q_values = [issueId, paginator.limit, paginator.offset];
        //TODO: order by created_date asc/desc using req.params
        const getIssueHistory_Q = `select * from comment_history where issue_id=$1 limit $2 offset $3`;
        const getIssueHistories_R = await client.query(getIssueHistory_Q, getIssueHistory_Q_values);

        const getCount_Q = `select COUNT(*) from comment_history h where issue_id=${issueId}`;
        const getCount_R = await client.query(getCount_Q);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, {comment_histories: getIssueHistories_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default CommentHistoryRouter;
