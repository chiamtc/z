export default class Sanitizer {
    constructor() {
        this._sanitize_reference = null;
        this._sanitized_array = [];
        this._query_string = '';
        this._query_val = [];
    }

    sanitize_request(val) {
        Object.entries(val).filter((e) => {
            if (this._sanitize_reference.get(e[0])) {
                this._sanitized_array.push({[e[0]]: e[1]});
            }
        });
    }

    build_query() {
        this._sanitized_array.map((e, i) => {
            const prop = Object.entries(e)[0];
            this._query_string += `${this._sanitize_reference.get(prop[0])}=$${i + 1}${i === this._sanitized_array.length - 1 ? '' : ', '}`; //produces db_name=$x with ' ' or ',' depending on position
            this._query_val.push(prop[1]);
        });
        return {query_string: this.query_string, query_val:this.query_val};
    }

    get sanitize_reference() {
        return this._sanitize_reference;
    }

    set sanitize_reference(value) {
        this._sanitize_reference = value;
    }

    get sanitized_array() {
        return this._sanitized_array;
    }

    set sanitized_array(value) {
        this._sanitized_array = value;
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
