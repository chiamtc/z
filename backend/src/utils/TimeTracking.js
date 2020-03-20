import {ErrorHandler} from "./ErrorHandler";

export default class TimeTracking {
    constructor() {
        this.new_value = 0;
        this._query_string = '';
        this._query_val = [];
        this._time_tracking_values = [];
        this._time_tracking_query = '';
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
