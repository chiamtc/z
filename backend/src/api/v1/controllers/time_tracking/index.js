import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpRequest from "../../../../utils/HttpRequest";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";

import TimeTracking from "../../models/TimeTracking";
import TimeTrackingMiddleware from "../../middlewares/time_tracking";

const TimeTrackingRouter = Router();

const ResponseUtil = new HttpResponse();
const RequestUtil = new HttpRequest();
const TimeTrackingModel = new TimeTracking();
const TimeTracking_Middleware = new TimeTrackingMiddleware();

TimeTrackingRouter.post('/', authenticate_jwtStrategy, TimeTrackingModel.sanitize_post_middleware, async (req, res, next) => {
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();
    try {
        await client.query('begin');
        const createTimeTracking_Q = `insert into time_tracking (${req.post_ops.query_string}) values (${SanitizerUtil.build_values(req.post_ops.query_val)}) returning *`;
        const createTimeTracking_R = await client.query(createTimeTracking_Q, req.post_ops.query_val);

        await client.query('commit');
        RequestUtil.append_request(req, {client, rows: createTimeTracking_R.rows});
        ResponseUtil.setResponse(201, ResponseFlag.OK, createTimeTracking_R.rows[0]);
        ResponseUtil.responds(res);
        next();
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
}, TimeTracking_Middleware.log_post_middleware);

TimeTrackingRouter.get('/issues/:issueId', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    try {
        const {issueId} = req.params;
        await client.query('begin');
        const getTimeTracking_Q_values = [issueId];
        const getTimeTracking_Q = `select * from time_tracking where issue_id=$1`;
        const getTimeTracking_R = await client.query(getTimeTracking_Q, getTimeTracking_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getTimeTracking_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

TimeTrackingRouter.get('/:id', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');
        const getTimeTracking_Q_values = [id];
        const getTimeTracking_Q = `select * from time_tracking where time_tracking_id=$1`;
        const getTimeTracking_R = await client.query(getTimeTracking_Q, getTimeTracking_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, getTimeTracking_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

TimeTrackingRouter.put('/:id', authenticate_jwtStrategy, TimeTrackingModel.sanitize_put_middleware, TimeTracking_Middleware.log_put_middleware, async (req, res) => {
    const tt = new TimeTracking();
    const {id} = req.params;
    const {client} = req;

    //building time tracking query and values
    try {
        tt.set_query_string_values(req.put_ops.query_string, req.put_ops.query_val);
        tt.extract_time_spent_value();
        tt.build_update_time_tracking_query_string();
        tt.time_tracking_values.push(parseInt(id))
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Time Tracking Building Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        const updateTimeTracking_Q_values = tt.time_tracking_values;
        const updateTimeTracking_Q = `update time_tracking set ${tt.time_tracking_query} where time_tracking_id=$${updateTimeTracking_Q_values.length} returning *`;
        const updateTimeTracking_R = await client.query(updateTimeTracking_Q, updateTimeTracking_Q_values);
        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateTimeTracking_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});


export default TimeTrackingRouter;
