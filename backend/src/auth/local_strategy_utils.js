import passport from "passport";
import ResponseFlag from "../constants/response_flag";
import HttpResponse_Utils from "../utils/HttpResponse_Utils";

const ResponseUtil = new HttpResponse_Utils();
export const authenticate_jwtStrategy = (req, res, next) => {

    passport.authenticate('jwt', (err, user, info) => {
        if (err || info) {
            ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, err ? ResponseFlag.UNAUTHORIZED_ENDPOINT_ACCESS: ResponseFlag.JWT_TOKEN_ERROR);
            ResponseUtil.responds(res);
        }
        if (user) {
            req.user = user;
            next();
        }

    })(req, res, next)
}


export const authenticate_loginStrategy = (req, res, next) => {
    passport.authenticate('login', (err, user, info) => {
        if (err) {
            ResponseUtil.setResponse(500, ResponseFlag.AUTH_ERROR, ResponseFlag.INVALID_CREDENTIALS);
            ResponseUtil.responds(res);
        }

        if (user) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, user);
            ResponseUtil.responds(res);
        }

        if (info) {
            ResponseUtil.setResponse(500, ResponseFlag.AUTH_ERROR, ResponseFlag.INVALID_CREDENTIALS);
            ResponseUtil.responds(res);
        }
        next();
    })(req, res, next)
};
