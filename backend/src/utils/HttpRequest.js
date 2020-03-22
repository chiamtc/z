export default class HttpRequest {
    constructor() {
        this.body = null;
        this.query = null;
        this.params = null;
    }

    extract_request_header(req) {
        this.body = req.body;
        this.query = req.query;
        this.params = req.params;
    };

    append_request(req, values) {
        return Object.keys(values).map((e) => req[e] = values[e]);
    }
}
