import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import TimeTracking from "../../../../utils/TimeTracking";
import TimeTrackingHistory from "../../../../utils/TimeTrackingHistory";

const TimeTrackingRouter = Router();

const ResponseUtil = new HttpResponse();

TimeTrackingRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const tth = new TimeTrackingHistory();
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
        if (f.query_string.includes('original_estimation') && !f.query_string.includes('remaining_estimation')) {
            f.query_string = f.query_string.concat(',remaining_estimation');
            f.query_val.push(f.query_val[f.query_string.split(',').map(e => e.trim()).indexOf('original_estimation')])
        }
        const createTimeTracking_Q = `insert into time_tracking (${f.query_string}) values (${SanitizerUtil.build_values(f.query_val)}) returning *`;
        const createTimeTracking_R = await client.query(createTimeTracking_Q, f.query_val);

        //todo; create time_tracking_history
        const arr = f.query_string.split(',').map(e => e.trim());

        arr.map(async (str, i) => {
            if (str !== 'issue_id') {
                let createHistory_Q_values = [createTimeTracking_R.rows[0].issue_id, createTimeTracking_R.rows[0].time_tracking_id, parseInt(req.user.person_id)];
                switch (str.trim()) {
                    case 'time_spent':
                        createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_LOGGED, f.query_val[i], 0, str);
                        const createLogHistory_Q = `insert into time_tracking_history(issue_id, time_tracking_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type) values($1, $2, $3, $4, $5, $6, $7);`
                        const createLogHistory_R = await client.query(createLogHistory_Q, createHistory_Q_values);

                        createHistory_Q_values.pop();
                        createHistory_Q_values.pop();
                        createHistory_Q_values.pop();
                        createHistory_Q_values.pop();
                        createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, f.query_val[i], 0, str);
                        const createSpentTimeHistory_Q = `insert into time_tracking_history(issue_id, time_tracking_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type) values($1, $2, $3, $4, $5, $6, $7);`
                        const createSpentTimeHistory_R = await client.query(createSpentTimeHistory_Q, createHistory_Q_values);
                        if (!arr.includes('remaining_estimation')) {
                            createHistory_Q_values.pop();
                            createHistory_Q_values.pop();
                            createHistory_Q_values.pop();
                            createHistory_Q_values.pop();
                            createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, 0, 0, 'remaining_estimation');
                            const createReEstHistory_Q = `insert into time_tracking_history(issue_id, time_tracking_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type) values($1, $2, $3, $4, $5, $6, $7);`
                            const createReEstHistory_R = await client.query(createReEstHistory_Q, createHistory_Q_values);
                        }
                        break;
                    default:
                        createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, f.query_val[i], 0, str);
                        const createHistory_Q = `insert into time_tracking_history(issue_id, time_tracking_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type) values($1, $2, $3, $4, $5, $6, $7);`
                        const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
                        break;
                }
            }
        });


        await client.query('commit');
        // ResponseUtil.setResponse(201, ResponseFlag.OK, 'ok');
        ResponseUtil.setResponse(201, ResponseFlag.OK, createTimeTracking_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

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

TimeTrackingRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();
    const tt = new TimeTracking();
    const {id} = req.params;
    const updateTimeTracking_ref = new Map();
    updateTimeTracking_ref.set('original_estimation', 'd');
    updateTimeTracking_ref.set('remaining_estimation', 'd');
    updateTimeTracking_ref.set('time_spent', 'd');
    updateTimeTracking_ref.set('start_date', 's');

    //sanitizing process
    try {
        SanitizerUtil.sanitize_reference = updateTimeTracking_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('post');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    //building time tracking query and values
    try {
        tt.set_query_string_values(f.query_string, f.query_val);
        tt.extract_time_spent_value();
        tt.build_update_time_tracking_query_string();
        tt.time_tracking_values.push(parseInt(id))
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Time Tracking Building Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');

        // create history regarding to issue update
        const arr = f.query_string.split(',').map(e => e.trim());

        arr.map(async (str, i) => {
            if (str !== 'issue_id') {
                switch (str) {
                    case 'time_spent':
                        const createSpentTimeHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, f.query_val[i], str.trim(), id];
                        const createSpentTimeHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, $3 + tt.${str}, tt.${str}, $4 from time_tracking tt where time_tracking_id= $5`;
                        const createSpentTimeHistory_R = await client.query(createSpentTimeHistory_Q, createSpentTimeHistory_Q_values);

                        const createLogHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_LOGGED, f.query_val[i], 0, str.trim(), id];
                        const createLogHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, $3, $4, $5 from time_tracking tt where time_tracking_id= $6`;
                        const createLogHistory_R = await client.query(createLogHistory_Q, createLogHistory_Q_values);

                        if (!arr.includes('remaining_estimation')) {
                            const createReEstHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, 'remaining_estimation', id];
                            const createReEstHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, tt.remaining_estimation, tt.remaining_estimation, $3 from time_tracking tt where time_tracking_id= $4`;
                            const createReEstHistory_R = await client.query(createReEstHistory_Q, createReEstHistory_Q_values);
                        }
                        break;
                    default:
                        const createHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, f.query_val[i], str.trim(), id];
                        const createHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, $3, tt.${str}, $4 from time_tracking tt where time_tracking_id= $5`;
                        const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
                        break;
                }
            }
        });

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
