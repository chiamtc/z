export default class TimeTracking {

    constructor() {
        this.new_value = 0;
        this._query_string = '';
        this._query_val = [];
        this._time_tracking_query = '';
    }

    set_query_string_values(query_string, query_val) {
        this._query_string = query_string;
        this._query_val = query_val;
        this.available_params = this.query_string.split(',').map(e => e.trim());
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

    extract_time_spent_value() {
        const time_spent_value = this.available_params.indexOf('time_spent');
        this.new_value = time_spent_value > -1 ? this.query_val[time_spent_value] : 0;
    }

    /*
         1. time_spent += new_val.
             a. remaining_estimation = remaining_estimation - time_spent, remaining_estimation > 0
             b. remaining_estimation = original_Estimation if remaining_estimation =0 and original_estimation = new_value
          */
    build_time_tracking_query_string() {
        if (this.available_params.includes('time_spent')) {
            this.time_tracking_query += `time_spent = time_spent + ${this.new_value},`;
        }

        if (this.available_params.includes('original_estimation')) {
            this.time_tracking_query += `original_estimation = ${this.query_val[this.available_params.indexOf('original_estimation')]}`;
            if (this.available_params.includes('remaining_estimation')) {
                this.time_tracking_query +=
                    `remaining_estimation = case
                        when remaining_estimation > 0 then
                            remaining_estimation - ${this.new_value}
                        when original_estimation > 0 and remaining_estimation < 0 then
                            ${this.query_val[this.available_params.indexOf('original_estimation')]}
                        else
                            ${this.query_val[this.available_params.indexOf('remaining_estimation')]}
                        end`;
            }
        }

        if (this.available_params.includes('remaining_estimation')) {
            this.time_tracking_query +=
                `remaining_estimation = case
                    when remaining_estimation > 0 then
                        remaining_estimation - ${this.new_value}
                            else
                                ${this.query_val[this.available_params.indexOf('remaining_estimation')]}
                        end`;
        }
    }
}
