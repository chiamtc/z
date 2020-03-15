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

    build_query(ops) {
        let qs= '';
        let qv = [];
        this._sanitized_array.map((e, i) => {
            //console.log('e',e);//{projectType: 'new project'}
            const prop = Object.entries(e)[0]; //[ ['projectType', 'new project']  .. ]
            const propType = this._sanitize_reference.get(prop[0]); //d , f or s
            let propValue;
            switch (propType) {
                case 'd':
                    propValue = parseInt(prop[1]);
                    break;
                case 's':
                    propValue = prop[1];
                    break;
                case 'f':
                    propValue = parseFloat(prop[1]);
                    break;
            }

            qs += ops === 'put' ?
                `${prop[0]}=$${i + 1}${i === this._sanitized_array.length - 1 ? '' : ', '}` :
                `${prop[0]}${i === this._sanitized_array.length - 1 ? '' : ', '}`;
            //produces db_name=$x with ' ' or ',' depending on position
            qv.push(propValue);
        });
        return {query_string: qs, query_val: qv};
    }

    build_values(values_array) {
        let insert_val = '';
        values_array.map((e, i) => insert_val += i === values_array.length - 1 ? `$${i + 1}` : `$${i + 1}, `);
        return insert_val;
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
