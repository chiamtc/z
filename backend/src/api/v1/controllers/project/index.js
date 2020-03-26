import {Router} from 'express';
import HttpResponse from "../../../../utils/HttpResponse";
import ResponseFlag from "../../../../constants/response_flag";
import db from "../../../../db";
import Sanitizer from "../../../../utils/Sanitizer";
import Paginator from "../../../../utils/Paginator";
import Project from "../../models/Project";

const ProjectRouter = Router();
const ProjectModel = new Project();
const ResponseUtil = new HttpResponse();

ProjectRouter.post('/', ProjectModel.sanitize_post_middleware, async (req, res, next) => {
    const client = await db.client();
    try {
        const SanitizerUtil = new Sanitizer();
        await client.query('begin');

        // not doing sanitizer reference with map because it's only 4 values to insert.
        //create project
        const createProject_Q = `insert into project(${req.post_ops.query_string}) values(${SanitizerUtil.build_values(req.post_ops.query_val)}) returning *`;
        const createProject_R = await client.query(createProject_Q, req.post_ops.query_val);

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
        ResponseUtil.setResponse(201, ResponseFlag.OK, response);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE}. Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

ProjectRouter.get('/:id', async (req, res) => {
    const client = await db.client();

    try {
        const {id} = req.params;
        await client.query('begin');
        let getProject_Q_values = [id];
        const getProject_Q = `select * from project where project_id=$1`;
        const getProject_R = await client.query(getProject_Q, getProject_Q_values);
        await client.query('commit');

        ResponseUtil.setResponse(200, ResponseFlag.OK, getProject_R.rows.length !== 0 ? getProject_R.rows[0] : {});
        ResponseUtil.responds(res);
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    }
});

//my project
ProjectRouter.get('/', async (req, res) => {
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
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

ProjectRouter.delete('/:id', async (req, res) => {
    const client = await db.client();
    let deleteProject_Q_values = [];
    try {
        const {id} = req.params;
        deleteProject_Q_values.push(parseInt(id));
    } catch (e) {
        ResponseUtil.setResponse(500, ResponseFlag.INTERNAL_ERROR, `Source: ${res.req.originalUrl} - Sanitizing Process: ${e.message}`);
        ResponseUtil.responds(res);
    }

    try {
        const body = req.body;
        await client.query('begin');

        const deleteProject_Q = `delete from project where project_id=$1 returning *`;
        const deleteProject_R = await client.query(deleteProject_Q, deleteProject_Q_values);
        await client.query('commit');
        if (deleteProject_R.rows.length !== 0) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, projects: deleteProject_R.rows[0]});
        } else {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
        }
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE}. Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});

ProjectRouter.put('/:id', ProjectModel.sanitize_put_middleware, async (req, res) => {
    const client = await db.client();
    const {id} = req.params;

    try {
        const updateProject_Q_values = [...req.put_ops.query_val, id]
        const updateProject_Q = `update project set ${req.put_ops.query_string} where project_id=$${updateProject_Q_values.length} returning *`;
        const updateProject_R = await client.query(updateProject_Q, updateProject_Q_values);
        ResponseUtil.setResponse(200, ResponseFlag.OK, updateProject_R.rows[0]);
        ResponseUtil.responds(res);
    } catch (e) {
        await client.query('rollback');
        ResponseUtil.setResponse(500, ResponseFlag.API_ERROR, `${res.req.originalUrl} ${ResponseFlag.API_ERROR_MESSAGE} Error: ${e}`);
        ResponseUtil.responds(res);
    } finally {
        await client.release();
    }
});


export default ProjectRouter;
