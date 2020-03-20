export default class TimeTrackingHistory {
    /*
     "time_tracking_id": 2,
        "original_estimation": 1500,
        "time_spent": 0,
        "remaining_estimation": 1500,
        "start_date": null,
        "created_date": "2020-03-20T06:06:38.947Z",
        "updated_date": "2020-03-20T06:06:38.947Z",
        "issue_id": 2
     */
    constructor() {
        this._old_query_string = '';
        this._new_query_string = '';
        this._old_query_val = [];
        this._new_query_val = [];
        this._time_tracking_history_values = [];
        this._time_tracking_history_query = '';
    }

    set_query_string_values(old_query_string, old_query_val, new_query_string, new_query_val) {
        this._old_query_string = old_query_string;
        this._old_query_val = old_query_val;

        this.old_available_params = this.old_query_string.split(',').map(e => e.trim());

        this._new_query_string = new_query_string;
        this._new_query_val = new_query_val;
    }

    build_time_tracking_history_query_string(){
        if(this.old_available_params.includes('time_spent')){

        }
    }

    get time_tracking_history_values() {
        return this._time_tracking_history_values;
    }

    set time_tracking_history_values(value) {
        this._time_tracking_history_values = value;
    }

    get time_tracking_history_query() {
        return this._time_tracking_history_query;
    }

    set time_tracking_history_query(value) {
        this._time_tracking_history_query = value;
    }

    get old_query_string() {
        return this._old_query_string;
    }

    set old_query_string(value) {
        this._old_query_string = value;
    }

    get new_query_string() {
        return this._new_query_string;
    }

    set new_query_string(value) {
        this._new_query_string = value;
    }

    get old_query_val() {
        return this._old_query_val;
    }

    set old_query_val(value) {
        this._old_query_val = value;
    }

    get new_query_val() {
        return this._new_query_val;
    }

    set new_query_val(value) {
        this._new_query_val = value;
    }
}
