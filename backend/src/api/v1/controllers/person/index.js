import {Router} from 'express';
import passport from 'passport';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse_Utils from "../../../../utils/HttpResponse_Utils";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";

const PersonRouter = Router();

const ResponseUtil = new HttpResponse_Utils();

PersonRouter.get('/me', authenticate_jwtStrategy, async (req, res, next) => {
    const client = await db.client();
    try {
        const getUser_Q_values = [req.user.auth_user_id]
        const getUser_Q = `select * from person where auth_user_id=$1`;
        const {rows} = await client.query(getUser_Q, getUser_Q_values);
        const payload = {
            auth_user_id: req.user.auth_user_id,
            person_id: rows[0].person_id,
            username: req.user.username,
            email: req.user.email,
            first_name: rows[0].first_name,
            last_name: rows[0].last_name,
            created_date: rows[0].created_date,
            updated_date: rows[0].updated_date,
            last_login: req.user.last_login
        };
        ResponseUtil.setResponse(200, ResponseFlag.OK, payload);
        ResponseUtil.responds(res);
    }catch(e){
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE}`);
        ResponseUtil.responds(res);
    }finally{
        client.release();
    }
});

PersonRouter.get('/:id', authenticate_jwtStrategy, async (req, res, next) => {
    const client = await db.client();
    try {
        const {id} = req.params;
        const getUser_Q_values = [id]
        const getUser_Q = `select * from person where auth_user_id=$1`;
        const getUser_R = await client.query(getUser_Q, getUser_Q_values);
        if (getUser_R.rows.length !== 0) {
            const getUser_R = await client.query(getUser_Q, getUser_Q_values);
            ResponseUtil.setResponse(200, ResponseFlag.OK, getUser_R.rows[0]);
            ResponseUtil.responds(res);
        } else {
            ResponseUtil.setResponse(404, ResponseFlag.OK, ResponseFlag.OBJECT_NOT_FOUND);
            ResponseUtil.responds(res);
        }
    }catch(e){
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE}`);
        ResponseUtil.responds(res);
    }finally{
        client.release();
    }
});

PersonRouter.put('/me', authenticate_jwtStrategy, (req, res, next) => {
    ResponseUtil.setResponse(200, ResponseFlag.OK, req.user);
    ResponseUtil.responds(res);
});


export default PersonRouter
