import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import TimeTracking from "../../../../utils/TimeTracking";
import TimeTrackingHistory from "../../../../utils/TimeTrackingHistory";
import Paginator from "../../../../utils/Paginator";

const TimeTrackingHistoryRouter = Router();

const ResponseUtil = new HttpResponse();

TimeTrackingHistoryRouter.get('/time_trackings/:timeTrackingId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);

    try {
        const {timeTrackingId} = req.params;
        await client.query('begin');
        const getTimeTrackingHistories_Q_values = [timeTrackingId, paginator.limit, paginator.offset];
        const getTimeTrackingHistories_Q = `select * from time_tracking_history where time_tracking_id=$1 limit $2 offset $3`;
        const getTimeTrackingHistories_R = await client.query(getTimeTrackingHistories_Q, getTimeTrackingHistories_Q_values);

        const getCount_Q = `select COUNT(*) from time_tracking_history where time_tracking_id=$1`;
        const getCount_R = await client.query(getCount_Q, [getTimeTrackingHistories_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, {time_tracking_histories: getTimeTrackingHistories_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

TimeTrackingHistoryRouter.get('/issues/:issueId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);
    try {
        const {issueId} = req.params;
        await client.query('begin');
        const getTimeTrackingHistories_Q_values = [issueId, paginator.limit, paginator.offset];
        const getTimeTrackingHistories_Q = `select * from time_tracking_history where issue_id=$1 limit $2 offset $3`;
        const getTimeTrackingHistories_R = await client.query(getTimeTrackingHistories_Q, getTimeTrackingHistories_Q_values);

        const getCount_Q = `select COUNT(*) from time_tracking_history where issue_id=$1`;
        const getCount_R = await client.query(getCount_Q, [getTimeTrackingHistories_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, {time_tracking_histories: getTimeTrackingHistories_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default TimeTrackingHistoryRouter;
