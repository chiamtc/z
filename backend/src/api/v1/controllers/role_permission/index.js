import {Router} from 'express';
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
const ResponseUtil = new HttpResponse();
const RolePermissionRouter = Router();

RolePermissionRouter.post('/', async (req, res, next) => {
   const client = await db.client();
   try{
       const {body} = req;
       await client.query('begin');
       const create_permissionRole_Q_values=[body.role_id, body.permission_id];
       const create_permissionRole_Q=`insert into role_permission(role_id, permission_id)values($1,$2) returning * `;
       const create_permissionRole_R = await client.query(create_permissionRole_Q, create_permissionRole_Q_values);
       await client.query('commit');
       ResponseUtil.setResponse(201, ResponseFlag.OK, create_permissionRole_R.rows[0]);
       ResponseUtil.responds(res);
   }catch(e){
       await client.query('rollback');
       ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
       ResponseUtil.responds(res);
   }finally{
       await client.release();
   }
});

RolePermissionRouter.put('/:roleId', async (req, res, next) => {
   const client = await db.client();
   try{
       const {body} = req;
       await client.query('begin');
       const update_permissionRole_Q_values=[req.params.roleId, body.permission_id];
       const update_permissionRole_Q=`update role_permission set role_id=$1, permission_id=$2 returning * `;
       const update_permissionRole_R = await client.query(update_permissionRole_Q, update_permissionRole_Q_values);
       await client.query('commit');
       ResponseUtil.setResponse(200, ResponseFlag.OK, update_permissionRole_R.rows[0]);
       ResponseUtil.responds(res);
   }catch(e){
       await client.query('rollback');
       ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
       ResponseUtil.responds(res);
   }finally{
       await client.release();
   }
});

export default RolePermissionRouter;
