import Sanitizer from "../../../../utils/Sanitizer";
import QueryConstant from "../../../../constants/query";
import db from "../../../../db";
import {ErrorHandler} from "../../../../utils/ErrorHandler";
import ResponseFlag from "../../../../constants/response_flag";

export default class IssueMiddleware {
    constructor() {
    }

    async log_post_middleware(req) {
        const SanitizerUtil = new Sanitizer();
        const {rows, client} = req;
        try {
            const createHistory_Q_values = [req.user.person_id, rows[0].issue_id, QueryConstant.ISSUE_HISTORY_ACTION_CREATED];
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            await client.query(createHistory_Q, createHistory_Q_values);
        } catch (e) {
            console.log(e);
        } finally {
            await client.release();
        }
    };

    async log_put_middleware(req,res,next){
        const client = await db.client();
        const {id} = req.params;

        // create history regarding to issue update

        req.log_ops.query_string.split(',').map(async (str, i) => {
            const createHistory_Q_values = [parseInt(req.user.person_id), QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, req.log_ops.query_val[i], str.trim(), id];
            const createHistory_Q = `insert into issue_history(issue_id, person_id, issue_history_action, new_content, old_content, updated_content_type)
                                select i.issue_id, $1, $2, $3, i.${str}, $4 from issue i where issue_id = $5`;
            await client.query(createHistory_Q, createHistory_Q_values);
        });
        req.client = client;
        next();
    }

    async log_post_assignee_middleware(req,res){
        const SanitizerUtil = new Sanitizer();
        const {client} = req;
        const {id}  = req.params;
        //create history
        try {
            const createHistory_Q_values = [req.user.person_id, id, QueryConstant.ISSUE_HISTORY_ACTION_UPDATED, null, req.post_ops.query_val[0], 'assignee'];
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, old_content, new_content, updated_content_type) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            await client.query(createHistory_Q, createHistory_Q_values);
        }catch(e){
            console.log(e);
        }finally{
            await client.release();
        }
    }

    async log_delete_assignee_middleware(req,res){
        const SanitizerUtil = new Sanitizer();
        const {client} = req;
        const {id}  = req.params;
        //create history
        try {
            //create history
            const createHistory_Q_values = [req.user.person_id, id, QueryConstant.ISSUE_HISTORY_ACTION_REMOVED, null, req.delete_ops.query_val[0], 'assignee'];
            console.log(createHistory_Q_values)
            const createHistory_Q = `insert into issue_history(person_id, issue_id, issue_history_action, old_content, new_content, updated_content_type) values(${SanitizerUtil.build_values(createHistory_Q_values)})`;
            await client.query(createHistory_Q, createHistory_Q_values);
        }catch(e){
            console.log(e);
        }finally{
            await client.release();
        }
    }


    async get_bucket_subpath_name(req, res, next) {
        const client = await db.client();
        const {id} = req.params;
        try {
            const getBucket_Q_values = [id];
            const getBucket_Q = `select project_id from project where project_id = (select project_id from issue where issue_id = $1);`;
            const getBucket_R = await client.query(getBucket_Q, getBucket_Q_values);

            if (getBucket_R.rows.length !== 0) {
                req.bucket_path = getBucket_R.rows[0].project_id;
                next();
            } else throw new ErrorHandler(500, ResponseFlag.OBJECT_NOT_FOUND, 'No such project id exists');
        } catch (e) {
            console.log(e);
            ResponseUtil.setResponse(500, ResponseFlag.OBJECT_NOT_FOUND, `Storage Error: ${e.message}.`);
            ResponseUtil.responds(res);
        }

    }
}
