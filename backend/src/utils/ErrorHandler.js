import HttpResponse_Utils from "./HttpResponse_Utils";

const ResponseUtil = new HttpResponse_Utils();
const handlerError = (err, res) => {
    const {type, statusCode, message} = err;
    ResponseUtil.setResponse(statusCode || err.status, type || err.name, message);
    ResponseUtil.responds(res);
};

class ErrorHandler extends Error {
    constructor(statusCode, type, message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
        this.type = type;
    }
}

module.exports = {
    ErrorHandler,
    handlerError
};
