import HttpResponse from "./HttpResponse";

const ResponseUtil = new HttpResponse();
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
