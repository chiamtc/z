import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import TimeTracking from "../../../../utils/TimeTracking";

const TimeTrackingRouter = Router();

const ResponseUtil = new HttpResponse();

TimeTrackingRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createTimeTracking_ref = new Map();
    createTimeTracking_ref.set('original_estimation', 'd');
    createTimeTracking_ref.set('remaining_estimation', 'd');
    createTimeTracking_ref.set('time_spent', 'd');
    createTimeTracking_ref.set('start_date', 's');
    createTimeTracking_ref.set('issue_id', 'd');

    try {
        SanitizerUtil.sanitize_reference = createTimeTracking_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        //create time tracking
        const createTimeTracking_Q = `insert into time_tracking (${f.query_string}) values (${SanitizerUtil.build_values(f.query_val)}) returning *`;
        const createTimeTracking_R = await client.query(createTimeTracking_Q, f.query_val);

        /*   f.query_string.split(',').map(async (str, i) => {
               switch (str) {
                   case 'time_spent':
                       const createHistory_Q_values = [createTimeTracking_R.rows[0].issue_id, parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_LOGGED, f.query_val[i], str, id];
                       const createHistory_Q = `insert into time_tracking_history(issue_id, person_id, issue_history_action, new_content, old_content, updated_content_type)
                                   select i.issue_id, $1, $2, $3, i.${str}, $4 from issue i where issue_id = $5`;
                       const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
                       break;
                   default :
                       break;
               }

           });*/
        //todo; create time_tracking_history
        // const createHistory_Q_values = [];
        // const createHistory_Q = `insert into time_tracking_history()values()`;
        // const createHistory_R = await client.query(createHistory_Q);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, createTimeTracking_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

TimeTrackingRouter.get('/:issueId', authenticate_jwtStrategy, async (req, res) => {
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

TimeTrackingRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const createTimeTracking_ref = new Map();
    createTimeTracking_ref.set('original_estimation', 'd');
    createTimeTracking_ref.set('remaining_estimation', 'd');
    createTimeTracking_ref.set('time_spent', 'd');
    createTimeTracking_ref.set('start_date', 's');

    try {
        SanitizerUtil.sanitize_reference = createTimeTracking_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        //create time tracking
        const createTimeTracking_Q = `update time_tracking (${f.query_string}) returning *`;
        // const createTimeTracking_R = await client.query(createTimeTracking_Q, f.query_val);

        //todo; create time_tracking_history
        // const createHistory_Q_values = [];
        // const createHistory_Q = `insert into time_tracking_history()values()`;
        // const createHistory_R = await client.query(createHistory_Q);

        const tt = new TimeTracking();
        const {id} = req.params;
        let new_val;
        // console.log(f.query_string.split(','), f);
        tt.set_query_string_values(f.query_string, f.query_val);
        tt.extract_time_spent_value();
        tt.build_time_tracking_query_string();
        console.log('h',tt.time_tracking_query);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, 'ok'); //createTimeTracking_R.rows[0]);
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
