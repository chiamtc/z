import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import db from "../../../../db";

export default class TimeTrackingMiddleware {
    constructor() {
    }

    async log_put_middleware(req,res,next){
        const client = await db.client();
        const {id} = req.params;
        // create history regarding to issue update
        const arr = req.put_ops.query_string.split(',').map(e => e.trim());
        await db.query('begin')
        arr.map(async (str, i) => {
            if (str !== 'issue_id') {
                switch (str) {
                    case 'time_spent':
                        const createSpentTimeHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, req.put_ops.query_val[i], str.trim(), id];
                        const createSpentTimeHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, $3 + tt.${str}, tt.${str}, $4 from time_tracking tt where time_tracking_id= $5`;
                        await client.query(createSpentTimeHistory_Q, createSpentTimeHistory_Q_values);

                        const createLogHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_LOGGED, req.put_ops.query_val[i], 0, str.trim(), id];
                        const createLogHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, $3, $4, $5 from time_tracking tt where time_tracking_id= $6`;
                        await client.query(createLogHistory_Q, createLogHistory_Q_values);

                        if (!arr.includes('remaining_estimation')) {
                            const createReEstHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, 'remaining_estimation', id];
                            const createReEstHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, tt.remaining_estimation, tt.remaining_estimation, $3 from time_tracking tt where time_tracking_id= $4`;
                            await client.query(createReEstHistory_Q, createReEstHistory_Q_values);
                        }
                        break;
                    default:
                        const createHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, req.put_ops.query_val[i], str.trim(), id];
                        const createHistory_Q = `insert into time_tracking_history(time_tracking_id, issue_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type)
                                select tt.time_tracking_id, tt.issue_id, $1, $2, $3, tt.${str}, $4 from time_tracking tt where time_tracking_id= $5`;
                        await client.query(createHistory_Q, createHistory_Q_values);
                        break;
                }
            }
        });
        await db.query('commit');
        req.client = client;
        next();
    }

    async log_post_middleware(req,res){
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        console.log(rows);
        try {
            await client.query('begin');
            const arr = req.post_ops.query_string.split(',').map(e => e.trim());
            const insertIntoTimeTrackingHistory = `insert into time_tracking_history(issue_id, time_tracking_id, person_id, time_tracking_history_action, new_content, old_content, updated_content_type) values`
            arr.map(async (str, i) => {
                if (str !== 'issue_id') {
                    let createHistory_Q_values = [rows[0].issue_id, rows[0].time_tracking_id, parseInt(req.user.person_id)];
                    switch (str.trim()) {
                        case 'time_spent':
                            createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_LOGGED, req.post_ops.query_val[i], 0, str);
                            const createLogHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                            await client.query(createLogHistory_Q, createHistory_Q_values);

                            createHistory_Q_values[3] = QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED;
                            const createSpentTimeHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                            await client.query(createSpentTimeHistory_Q, createHistory_Q_values);
                            if (!arr.includes('remaining_estimation')) {
                                createHistory_Q_values[4] = 0;
                                createHistory_Q_values[5] = 0;
                                createHistory_Q_values[6] = 'remaining_estimation';
                                const createReEstHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                                await client.query(createReEstHistory_Q, createHistory_Q_values);
                            }
                            break;
                        default:
                            createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, req.post_ops.query_val[i], 0, str);
                            const createHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                            await client.query(createHistory_Q, createHistory_Q_values);
                            break;
                    }
                }
            });
            await client.query('commit');
        }catch(e){
            await client.query('rollback');
            console.log('e',e)
        }finally{
            await client.release();
        }
    }
}
