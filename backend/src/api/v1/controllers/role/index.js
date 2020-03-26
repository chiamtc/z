import {Router} from 'express';
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";
import Role from "../../models/Role";

const RoleRouter = Router();
const ResponseUtil = new HttpResponse();
const RoleModel = new Role();
/*
 -> create permission
    - can create,
    - can read,
    - can update,
    - can delete
-> create role_name (aka position or whatever)
    - project owner - CRUD
    - engineer      - CRUD
    - collaborators - CRUD
    - viewer        - R

-> assign role_name to permission
    - permission_id
    - role_id
    - voila with the role_permission table
 */

RoleRouter.post('/', async (req, res, next) => {
    let client = await db.client();
    try {
        const {body} = req;
        const grants = body.grants || "['auth_user','person']";
        const createRole_Q_values = [body.role_name, body.description, body.project_id];
        client.query('begin');
        const createRole_Q = `insert into role(role_name, description, project_id, grants) values($1,$2,$3, ARRAY${grants}::grants_enum[]) returning *`;
        const createRole_R = await client.query(createRole_Q, createRole_Q_values);
        client.query('commit');

        const role = createRole_R.rows[0];
        role.grants = RoleModel.enum_to_array(role.grants);
        ResponseUtil.setResponse(201, ResponseFlag.OK, role);
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e)
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

RoleRouter.get('/:id', async (req, res, next) => {
    let client = await db.client();
    try {
        const {id} = req.params;
        const getRole_Q_values = [id];
        const getRole_Q = `select * from role where role_id = $1 `;
        const getRole_R = await client.query(getRole_Q, getRole_Q_values);
        if (getRole_R.rows.length !== 0) {
            const role = getRole_R.rows[0];
            role.grants = RoleModel.enum_to_array(role.grants);
            ResponseUtil.setResponse(200, ResponseFlag.OK, role);
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
});

RoleRouter.get('/projects/:projectId', async (req, res, next) => {
    let client = await db.client();
    try {
        const {projectId} = req.params;
        const getProjectRole_Q_values = [projectId];
        const getProjectRole_Q = `select * from role where project_id = $1 `;
        const getProjectRole_R = await client.query(getProjectRole_Q, getProjectRole_Q_values);
        ResponseUtil.setResponse(200, ResponseFlag.OK, getProjectRole_R.rows);
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

RoleRouter.put('/:id', RoleModel.sanitize_put_middleware, async (req, res, next) => {
    let client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');
        let qs = '';
        if (req.body.grants) {
            const comma = req.put_ops.query_string.length !== 0 ? `${req.put_ops.query_string},` : '';
            qs = `${comma} grants=array${req.body.grants}::grants_enum[]`
        } else qs = `${req.put_ops.query_string}`;

        //update comment
        const updateRole_Q_values = [...req.put_ops.query_val, id];
        const updateRole_Q = `update role set ${qs} where role_id=$${updateRole_Q_values.length} returning *`;
        console.log(updateRole_Q)
        const updateRole_R = await client.query(updateRole_Q, updateRole_Q_values);

        await client.query('commit');
        const role = updateRole_R.rows[0];
        role.grants = RoleModel.enum_to_array(role.grants);
        ResponseUtil.setResponse(200, ResponseFlag.OK, role);
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateRole_R.rows.length !== 0 ? updateRole_R.rows[0] : {});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});


RoleRouter.delete('/:id', async (req, res, next) => {
    let client = await db.client();
    try {
        const {id} = req.params;
        await client.query('begin');

        //update comment
        const deleteRole_Q_values = [id];
        const deleteRole_Q = `delete from role where role_id= $1 returning *`;
        const deleteRole_R = await client.query(deleteRole_Q, deleteRole_Q_values);

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, deleteRole_R.rows.length !== 0 ? {
            deleted: true,
            role: deleteRole_R.rows[0]
        } : {deleted: false});
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default RoleRouter;
