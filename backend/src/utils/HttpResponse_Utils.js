export default class HttpResponse_Utils {
    constructor() {
        this.statusCode = null;
        this.type = null;
        this.data = null;
    }

    setResponse(statusCode, type, message) {
        this.statusCode = statusCode;
        this.type = type;
        this.data = message;
    }

    responds(res) {
        const payload = {status: this.statusCode};
        if (this.type.toLowerCase().includes('error')) res.status(payload.status).json({...payload, message: this.data})
        else res.status(payload.status).json({...payload, data: this.data});
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
