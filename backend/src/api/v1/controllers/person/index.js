import {Router} from 'express';
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";

const PersonRouter = Router();

const ResponseUtil = new HttpResponse();

PersonRouter.get('/me', async (req, res) => {
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
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

PersonRouter.get('/:id', async (req, res, next) => {
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
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

PersonRouter.put('/me', async (req, res, next) => {
    let f;
    const client = await db.client();
    const SanitizerUtil = new Sanitizer();

    const updateMe_ref = new Map();
    updateMe_ref.set('first_name', 's');
    updateMe_ref.set('last_name', 's');
    // updateMe_ref.set('email', 'email'); //another endpoint for /me/email  or update My email

    try {
        SanitizerUtil.sanitize_reference = updateMe_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        const updateMe_Q_values = [...f.query_val, req.user.auth_user_id];
        const updateMe_Q = `update person set ${f.query_string} where auth_user_id=$${updateMe_Q_values.length} RETURNING *`;
        const {rows} = await client.query(updateMe_Q, updateMe_Q_values);
        if(rows.length !== 0){
            await client.query('commit');
            ResponseUtil.setResponse(200, ResponseFlag.OK, rows[0]);
            ResponseUtil.responds(res);
        }else{
            ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.OBJECT_NOT_UPDATED}`);
            ResponseUtil.responds(res);
        }
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default PersonRouter;
