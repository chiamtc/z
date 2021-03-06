import {Router} from 'express';
import db from '../../../../db'
import HttpResponse from "../../../../utils/HttpResponse";
import HttpRequest from "../../../../utils/HttpRequest";
import ResponseFlag from "../../../../constants/response_flag";
import bcrypt from 'bcrypt';
import {authenticate_loginStrategy} from "../../../../auth/local_strategy_utils";
import Sanitizer from "../../../../utils/Sanitizer";

const AuthUserRouter = Router();
const RequestUtil = new HttpRequest();
const ResponseUtil = new HttpResponse();


AuthUserRouter.post('/signup', async (req, res) => {
    const client = await db.client();
    try {
        RequestUtil.extract_request_header(req);
        const body = RequestUtil.body;
        await client.query('begin');
        const createUser_R = await create_newUser(client, body);
        if (createUser_R.rows.length === 0) ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, ResponseFlag.USER_EXISTS_IN_DATABASE);
        else {
            const {auth_user_id, email} = createUser_R.rows[0];
            const createPerson_R = await create_newPerson(client, {...body, email, auth_user_id})
            ResponseUtil.setResponse(201, ResponseFlag.OK, createPerson_R.rows[0]);
        }
        await client.query('commit');
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

const create_newUser = async (client, body) => {
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUND));
        const password = await bcrypt.hash(body.password, salt);
        const query_values = [body.email, body.username, password, body.email];
        const query = `insert into auth_user (email, username, password)
                         select $1, $2, $3 where not exists (select * from auth_user where email= $4)
                         RETURNING auth_user_id, email, username, created_date, updated_date`;
        return await client.query(query, query_values);
    } catch (e) {
        await client.query('rollback');
    }
};

const create_newPerson = async (client, body) => {
    try {
        const SanitizerUtil = new Sanitizer();
        const query_values = [body.auth_user_id, body.first_name, body.last_name, body.email];
        const query = `insert into person (auth_user_id, first_name, last_name, email)
                         values(${SanitizerUtil.build_values(query_values)}) RETURNING *`;
        return await client.query(query, query_values);
    } catch (e) {
        await client.query('rollback');
    }
};

AuthUserRouter.post('/login', authenticate_loginStrategy);

AuthUserRouter.put('/email', (req, res, next) => {
    //TODO: update email on auth_user and person
});

AuthUserRouter.put('password', (req, res, next) => {
    //TODO: update password on auth_user;
})

export default AuthUserRouter;
