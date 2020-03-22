import {ErrorHandler} from "../../../utils/ErrorHandler";
import Sanitizer from "../../../utils/Sanitizer";
import ResponseFlag from "../../../constants/response_flag";
import QueryConstant from "../../../constants/query";

export default class TimeTracking {
    constructor() {
        this.new_value = 0;
        this._query_string = '';
        this._query_val = [];
        this._time_tracking_values = [];
        this._time_tracking_query = '';
    }

    sanitize_post_middleware(req,res,next){
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
            const f = SanitizerUtil.build_query('post');
            if (f.query_string.includes('original_estimation') && !f.query_string.includes('remaining_estimation')) {
                f.query_string = f.query_string.concat(',remaining_estimation');
                f.query_val.push(f.query_val[f.query_string.split(',').map(e => e.trim()).indexOf('original_estimation')])
            }
            req.post_ops = f;
            next();
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
            ResponseUtil.responds(res);
        }
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
                            const createLogHistory_R = await client.query(createLogHistory_Q, createHistory_Q_values);

                            createHistory_Q_values[3] = QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED;
                            const createSpentTimeHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                            const createSpentTimeHistory_R = await client.query(createSpentTimeHistory_Q, createHistory_Q_values);
                            if (!arr.includes('remaining_estimation')) {
                                createHistory_Q_values[4] = 0;
                                createHistory_Q_values[5] = 0;
                                createHistory_Q_values[6] = 'remaining_estimation';
                                const createReEstHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                                const createReEstHistory_R = await client.query(createReEstHistory_Q, createHistory_Q_values);
                            }
                            break;
                        default:
                            createHistory_Q_values.push(QueryConstant.TIME_TRACKING_HISTORY_ACTION_UPDATED, req.post_ops.query_val[i], 0, str);
                            const createHistory_Q = `${insertIntoTimeTrackingHistory} (${SanitizerUtil.build_values(createHistory_Q_values)});`;
                            const createHistory_R = await client.query(createHistory_Q, createHistory_Q_values);
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

    set_query_string_values(query_string, query_val) {
        this._query_string = query_string;
        this._query_val = query_val;
        this.available_params = this.query_string.split(',').map(e => e.trim());
    }

    extract_time_spent_value() {
        const time_spent_value = this.available_params.indexOf('time_spent');
        this.new_value = time_spent_value > -1 ? this.query_val[time_spent_value] : 0;
    }

    append_comma(str, pos) {
        return str.concat(this.query_val.length !== 1 ? (pos === this.query_val.length - 1 ? '' : ',') : '');
    }

    build_update_time_tracking_query_string() {
        let index = 0;
        if (this.available_params.includes('time_spent')) {
            this.time_tracking_values.push(this.new_value);
            index++;
            this.time_tracking_query += `time_spent = time_spent + $${index},`;
            if (this.available_params.indexOf('remaining_estimation') === -1) {
                this.time_tracking_values.push(this.new_value);
                index++;
                this.time_tracking_query += this.append_comma(`remaining_estimation = case 
                    when remaining_estimation > 0 then
                        remaining_estimation - $${index}
                    else
                        remaining_estimation
                    end`, this.available_params.indexOf('remaining_estimation'))
            }
        }

        if (this.available_params.includes('original_estimation')) {
            this.time_tracking_values.push(this.query_val[this.available_params.indexOf('original_estimation')]);
            index++;
            this.time_tracking_query += this.append_comma(`original_estimation = $${index}`, this.available_params.indexOf('original_estimation'));
            if (this.available_params.includes('remaining_estimation')) {
                this.time_tracking_values.push(this.new_value);
                index++;
                this.time_tracking_values.push(this.query_val[this.available_params.indexOf('original_estimation')]);
                this.time_tracking_values.push(this.query_val[this.available_params.indexOf('remaining_estimation')]);
                this.time_tracking_query +=
                    `remaining_estimation = case
                        when remaining_estimation > 0 then
                            remaining_estimation - $${index}
                        when original_estimation > 0 and remaining_estimation < 0 then
                            $${this.time_tracking_values.length - 1}
                        else
                            $${this.time_tracking_values.length}
                        end`;
                return;
            }
        }

        if (this.available_params.includes('remaining_estimation')) {
            this.time_tracking_values.push(this.query_val[this.available_params.indexOf('remaining_estimation')]);
            index++;
            this.time_tracking_query += this.append_comma(`remaining_estimation = $${index}`, this.available_params.indexOf('remaining_estimation'));
        }

        if (this.available_params.includes('start_date')) {
            this.time_tracking_values.push(this.query_val[this.available_params.indexOf('start_date')]);
            index++;
            this.time_tracking_query += this.append_comma(`start_date = $${index}`, this.available_params.indexOf('start_date'));
        }
    }

    get time_tracking_values() {
        return this._time_tracking_values;
    }

    set time_tracking_values(value) {
        this._time_tracking_values = value;
    }

    get time_tracking_query() {
        return this._time_tracking_query;
    }

    set time_tracking_query(value) {
        this._time_tracking_query = value;
    }

    get query_string() {
        return this._query_string;
    }

    set query_string(value) {
        this._query_string = value;
    }

    get query_val() {
        return this._query_val;
    }

    set query_val(value) {
        this._query_val = value;
    }
}
