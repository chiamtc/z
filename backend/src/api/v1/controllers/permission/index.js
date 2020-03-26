import {Router} from 'express';
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";

const PermissionRouter = Router();
const ResponseUtil = new HttpResponse();

PermissionRouter.get('/', async (req, res) => {
    let client = await db.client();
    try {
        const createPermission_Q = `select * from permission`;
        const createPermission_R = await client.query(createPermission_Q);

        ResponseUtil.setResponse(200, ResponseFlag.OK, {permissions:createPermission_R.rows});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default PermissionRouter;
