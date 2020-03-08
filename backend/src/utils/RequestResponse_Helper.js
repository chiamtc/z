const extract_request_header = (req) => {
    const {body, query, params} = req;
    return {body, query, params}
};

const construct_response_payload = (res, status, message) => res.status(status).json(message);

const RequestResponse_Helper ={
    extract_request_header,
    construct_response_payload
};

export default RequestResponse_Helper;
