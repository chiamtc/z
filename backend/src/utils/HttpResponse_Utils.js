export default class HttpResponse_Utils {
    constructor() {
        this.statusCode = null;
        this.type = null;
        this.data = null;
        this.message = null;
    }


    setSuccess(statusCode, payload) {
        this.statusCode = statusCode;
        this.data = payload;
    }

    setFailure(statusCode, type, message) {
        this.statusCode = statusCode;
        this.type = type;
        this.message = message;
    }

    responds(res) {
        const payload = {status: this.statusCode};
        if (this.type.toLowerCase().includes('error')) {
            res.status(payload.status).json({...payload, message: this.message})
        }else {
            res.status(payload.status).json({...payload, data: this.data});
        }
    }
}
/*
{
   "object": "list",
   "data":"..",
  "has_more": true,
  "url": "/v1/customers"
}
 */
