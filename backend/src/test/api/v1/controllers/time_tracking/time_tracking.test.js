import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';

const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";

chai.use(chaiHttp);

describe('tests /time_tracking endpoint', () => {
    let accessToken;
    let projectId;
    let personId;
    let issueId;
    beforeAll(async (done) => {
        await exec('npm run db:down');
        await exec('npm run db:general:up');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');
        await exec('npm run db:project:up');
        await exec('npm run db:proj_parti:up');
        await exec('npm run db:sprint:up');
        await exec('npm run db:issue:up');
        await exec('npm run db:issue_history:up');
        await exec('npm run db:parti_issue:up');
        await exec('npm run db:comment:up');
        await exec('npm run db:comment_history:up');
        await exec('npm run db:time_tracking:up');
        await exec('npm run db:time_tracking_history:up');

        //Pre-requisite #1 = creates a user
        chai.request('localhost:3000')
            .post('/api/v1/users/signup')
            .send({
                email: c.email,
                username: c.username,
                password: c.password,
                first_name: c.firstName,
                last_name: c.lastName
            })
            .end((err, res) => {
                console.log(_.isEmpty(res.body) ? null : 'user signed up successfully in login test beforeAll hook');
                //Pre-requisite #2 = login the user;
                chai.request('localhost:3000')
                    .post('/api/v1/users/login')
                    .send({username: c.username, password: c.password})
                    .end((err, res) => {
                        const body = res.body.data;
                        assert.equal(res.body.status, 200);
                        assert.isNotEmpty(res.body.data);
                        assert.equal(body.email, c.email);
                        accessToken = res.body.data.accessToken;
                        personId = body.auth_user_id;
                        expect(body).to.have.property('auth_user_id');
                        expect(body).to.have.property('email');
                        expect(body).to.have.property('created_date');
                        expect(body).to.have.property('updated_date');
                        expect(body).to.have.property('last_login');
                        //TODO: assert and expect jwt token later

                        //Pre-requisite #3 = creates a project
                        chai.request('localhost:3000')
                            .post('/api/v1/projects')
                            .set('Authorization', `Bearer ${accessToken}`)
                            .send({
                                project_name: c.projectName,
                                project_desc: c.projectDesc,
                                project_type: c.projectType
                            })
                            .end((err, res) => {
                                const body = res.body.data;
                                assert.equal(res.body.status, 201);
                                assert.isNotEmpty(res.body.data);
                                projectId = body.project_id;
                                assert.equal(body.project_name, c.projectName);
                                assert.equal(body.project_desc, c.projectDesc);
                                assert.equal(body.project_type, c.projectType);

                                expect(body).to.have.property('project_id');
                                expect(body).to.have.property('project_name');
                                expect(body).to.have.property('project_desc');
                                expect(body).to.have.property('project_type');
                                expect(body).to.have.property('project_lead');
                                expect(body).to.have.property('created_date');
                                expect(body).to.have.property('updated_date');
                                chai.request('localhost:3000')
                                    .post('/api/v1/issues')
                                    .set('Authorization', `Bearer ${accessToken}`)
                                    .send({
                                        issue_name: c.issueName,
                                        issue_type: 'task',
                                        issue_desc: c.issueDesc,
                                        issue_story_point: c.issueStoryPoint,
                                        issue_priority: c.issuePriority,
                                        issue_status: c.issueStatus,
                                        reporter: 1,
                                        project_id: projectId
                                    })
                                    .end((err, res) => {
                                        const body = res.body.data;
                                        assert.equal(res.body.status, 201);
                                        assert.isNotEmpty(res.body.data);
                                        issueId = body.issue_id;
                                        assert.equal(body.issue_name, c.issueName);
                                        assert.equal(body.issue_type, 'task');
                                        assert.equal(body.issue_priority, c.issuePriority);
                                        assert.equal(body.issue_status, c.issueStatus);
                                        assert.equal(body.issue_desc, c.issueDesc);
                                        assert.equal(body.issue_story_point, c.issueStoryPoint);
                                        assert.equal(body.reporter, 1);
                                        assert.equal(body.project_id, projectId);
                                        assert.isNull(body.parent_issue_id);

                                        expect(body).to.have.property('project_id');
                                        expect(body).to.have.property('issue_id');
                                        expect(body).to.have.property('parent_issue_id');
                                        expect(body).to.have.property('issue_name');
                                        expect(body).to.have.property('issue_type');
                                        expect(body).to.have.property('issue_desc');
                                        expect(body).to.have.property('issue_story_point');
                                        expect(body).to.have.property('issue_desc');
                                        expect(body).to.have.property('issue_priority');
                                        expect(body).to.have.property('issue_status');
                                        expect(body).to.have.property('reporter');
                                        expect(body).to.have.property('created_date');
                                        expect(body).to.have.property('updated_date');
                                        done();
                                    }); //end pre-requisite #3
                            });
                    }); //end pre-requisite #2
            }); //end pre-requisite #1
    });

    it('POST/ time tracking successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/time_tracking')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                original_estimation: 1000,
                issue_id: issueId,
                time_spent: 300,
                remaining_estimation: 1000,
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.original_estimation, 1000);
                assert.equal(body.time_spent, 300);
                assert.equal(body.remaining_estimation, 1000);
                expect(body).to.have.property('time_tracking_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('original_estimation');
                expect(body).to.have.property('remaining_estimation');
                expect(body).to.have.property('time_spent');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('POST/ fails due to absence of jwt', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/time_tracking')
            .send({
                original_estimation: 1000,
                issue_id: issueId,
                time_spent: 300,
                remaining_estimation: 1000,
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('time_tracking_id');
                expect(body).to.not.have.property('issue_id');
                expect(body).to.not.have.property('original_estimation');
                expect(body).to.not.have.property('remaining_estimation');
                expect(body).to.not.have.property('time_spent');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('GET/issues/:issueId time tracking successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/time_tracking/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.original_estimation, 1000);
                assert.equal(body.time_spent, 300);
                assert.equal(body.remaining_estimation, 1000);
                expect(body).to.have.property('time_tracking_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('original_estimation');
                expect(body).to.have.property('remaining_estimation');
                expect(body).to.have.property('time_spent');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('GET/:id time tracking successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/time_tracking/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.original_estimation, 1000);
                assert.equal(body.time_spent, 300);
                assert.equal(body.remaining_estimation, 1000);
                expect(body).to.have.property('time_tracking_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('original_estimation');
                expect(body).to.have.property('remaining_estimation');
                expect(body).to.have.property('time_spent');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('PUT/ time tracking time_spent successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/time_tracking/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                // original_estimation: 1000,
                // issue_id: issueId,
                time_spent: 300,
                // remaining_estimation: 1000,
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.original_estimation, 1000);
                assert.equal(body.time_spent, 600);
                assert.equal(body.remaining_estimation, 700);
                expect(body).to.have.property('time_tracking_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('original_estimation');
                expect(body).to.have.property('remaining_estimation');
                expect(body).to.have.property('time_spent');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('PUT/ time tracking remaining_estimation successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/time_tracking/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                // original_estimation: 1000,
                // issue_id: issueId,
                time_spent: 300,
                remaining_estimation: 1000,
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.original_estimation, 1000);
                assert.equal(body.time_spent, 900);
                assert.equal(body.remaining_estimation, 1000);
                expect(body).to.have.property('time_tracking_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('original_estimation');
                expect(body).to.have.property('remaining_estimation');
                expect(body).to.have.property('time_spent');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('PUT/ time tracking original_estimation successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/time_tracking/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                original_estimation: 2000,
                // issue_id: issueId,
                // time_spent: 300,
                // remaining_estimation: 1000,
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.original_estimation, 2000);
                assert.equal(body.time_spent, 900);
                assert.equal(body.remaining_estimation, 1000);
                expect(body).to.have.property('time_tracking_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('original_estimation');
                expect(body).to.have.property('remaining_estimation');
                expect(body).to.have.property('time_spent');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });
})
