import {Router} from 'express';
import {authenticate_jwtStrategy} from "../../../../auth/local_strategy_utils";
import HttpResponse from "../../../../utils/HttpResponse";
import HttpRequest from "../../../../utils/HttpRequest";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";

const ProjectRouter = Router();

const ResponseUtil = new HttpResponse();
const RequestUtil = new HttpRequest();

ProjectRouter.post('/', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    try {
        const SanitizerUtil = new Sanitizer();
        RequestUtil.extract_request_header(req);
        const body = RequestUtil.body;
        await client.query('begin');

        // not doing sanitizer reference with map because it's only 4 values to insert.
        //create project
        const createProject_Q_values = [body.project_name, body.project_desc, body.project_type, req.user.person_id];
        const createProject_Q = `insert into project(project_name, project_desc, project_type, project_lead) values(${SanitizerUtil.build_values(createProject_Q_values)}) returning *`;
        const createProject_R = await client.query(createProject_Q, createProject_Q_values);

        //create project_participant
        const updateProjParti_Q_values = [parseInt(createProject_R.rows[0].project_id), parseInt(req.user.person_id)];
        const updateProjParti_Q = `insert into project_participant(project_id, participant_id) values(${SanitizerUtil.build_values(updateProjParti_Q_values)})`;
        const updateProjParti_R = await client.query(updateProjParti_Q, updateProjParti_Q_values);
        const response = {
            ...createProject_R.rows[0],
            first_name: req.user.first_name,
            last_name: req.user.last_name
        };

        await client.query('commit');
        ResponseUtil.setResponse(200, ResponseFlag.OK, response);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE}. Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

//TODO get/:id

ProjectRouter.get('/', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    const paginator = new Paginator(req.query.limit, req.query.offset);

    try {
        await client.query('begin');
        let getProject_Q_values = [req.user.person_id, paginator.limit, paginator.offset];
        const getProjects_Q = `select * from project p inner join project_participant pp on p.project_id = pp.project_id and pp.participant_id = $1 limit $2 offset $3`;
        const getProjects_R = await client.query(getProjects_Q, getProject_Q_values);

        const getCount_Q = `select COUNT(*) from project p inner join project_participant pp on p.project_id = pp.project_id and pp.participant_id = $1`;
        const getCount_R = await client.query(getCount_Q, [getProject_Q_values[0]]);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = paginator.get_hasMore(total_count);
        await client.query('commit');

        ResponseUtil.setResponse(200, ResponseFlag.OK, {projects: getProjects_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

ProjectRouter.delete('/:id', authenticate_jwtStrategy, async (req, res) => {
    const client = await db.client();
    let deleteProject_Q_values = [];
    try {
        const {id} = req.params;
        deleteProject_Q_values.push(parseInt(id));
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        RequestUtil.extract_request_header(req);
        const body = RequestUtil.body;
        await client.query('begin');

        const deleteProjParti_Q = `delete from project_participant where project_id=$1`;
        const deleteProjParti_R = await client.query(deleteProjParti_Q, deleteProject_Q_values);

        const deleteProject_Q = `delete from project where project_id=$1 returning *`;
        const deleteProject_R = await client.query(deleteProject_Q, deleteProject_Q_values);
        await client.query('commit');
        if (deleteProject_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, projects: deleteProject_R.rows[0]});
        } else {
            ResponseUtil.setResponse(200, ResponseFlag.OK, ResponseFlag.OBJECT_NOT_DELETED);
        }
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE}. Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

ProjectRouter.put('/:id', authenticate_jwtStrategy, async (req, res) => {
    let f;
    const client = await db.client();
    const {id} = req.params;
    const SanitizerUtil = new Sanitizer();

    const updateProject_ref = new Map();
    updateProject_ref.set('project_name', 's');
    updateProject_ref.set('project_desc', 's');
    updateProject_ref.set('project_lead', 'd');
    try {
        SanitizerUtil.sanitize_reference = updateProject_ref;
        SanitizerUtil.sanitize_request(req.body);
        f = SanitizerUtil.build_query('put');
        const updateProject_Q_values = [...f.query_val, id]
        const updateProject_Q = `update project set ${f.query_string} where project_id=$${updateProject_Q_values.length} returning *`;
        const updateProject_R = await client.query(updateProject_Q, updateProject_Q_values);
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateProject_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

//this endpoint should not be consumed at all
ProjectRouter.get('/all', authenticate_jwtStrategy, async (req, res) => {
    let queryLimit = 5, queryOffset = 0;
    const client = await db.client();
    try {
        if (req.query.hasOwnProperty('limit')) {
            const {limit} = req.query;
            queryLimit = parseInt(limit);
            if (queryLimit <= 0) {
                ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: query limit must be more than equal 1`);
                ResponseUtil.responds(res);
            }
        }
        if (req.query.hasOwnProperty('offset')) {
            const {offset} = req.query;
            queryOffset = parseInt(offset);
        }
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.baseUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        await client.query('begin');
        let getProject_Q_values = [queryLimit, queryOffset];
        const getProjects_Q = `select * from project limit $1 offset $2`;
        const getProjects_R = await client.query(getProjects_Q, getProject_Q_values);

        const getCount_Q = `select COUNT(*) from project`;
        const getCount_R = await client.query(getCount_Q);

        const total_count = parseInt(getCount_R.rows[0].count);
        const has_more = queryLimit * (queryOffset + 1) < total_count;
        await client.query('commit');

        ResponseUtil.setResponse(200, ResponseFlag.OK, {projects: getProjects_R.rows, total_count, has_more});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.baseUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

export default ProjectRouter;
