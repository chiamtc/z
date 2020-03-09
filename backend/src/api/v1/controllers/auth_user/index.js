import {Router} from 'express';
import passport from 'passport';
import db from '../../../../db'
import HttpResponse_Utils from "../../../../utils/HttpResponse_Utils";
import HttpRequest_Utils from "../../../../utils/HttpRequest_Utils";
import {ErrorHandler} from "../../../../utils/ErrorHandler";
import ResponseFlag from "../../../../constants/response_flag";
import bcrypt from 'bcrypt';

const AuthUserRouter = Router();
const ResponseUtil = new HttpResponse_Utils();
const RequestUtil = new HttpRequest_Utils();

AuthUserRouter.get('/', async (req, res) => {
    res.status(200).json({status: '/users is working'})
});

AuthUserRouter.get('/error', (req, res) => {
    throw new ErrorHandler(500, 'error', 'error message')
});

AuthUserRouter.post('/signup', async (req, res) => {
    try {
        const client = await db.client();
        RequestUtil.extract_request_header(req);
        const body = RequestUtil.body;
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUND));
        const password = await bcrypt.hash(body.password, salt);
        const query_values = [body.email, body.username, password, body.email];
        const query = `insert into auth_user (email, username, password)
                         select $1, $2, $3 where not exists (select * from auth_user where email= $4)
                         RETURNING auth_user_id, email, username, created_date, updated_date`;

        const searchUser_Q = await client.query(query, query_values);
        if (searchUser_Q.rows.length === 0) ResponseUtil.setSuccess(200, ResponseFlag.USER_EXISTS_IN_DATABASE);
        else ResponseUtil.setSuccess(201, searchUser_Q.rows[0]);

        ResponseUtil.responds(res);
    } catch (e) {
        throw new ErrorHandler(500, 'error', e.message)
    }
});

AuthUserRouter.post('/login', passport.authenticate('login', {
    session: false,
    failWithError: true
}), (req, res) => {
    ResponseUtil.setSuccess(200, req.user);
    ResponseUtil.responds(res);
});

export default AuthUserRouter;
