import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';

const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";

chai.use(chaiHttp);
describe('tests /issues endpoint', () => {
    let accessToken;
    let projectId;
    beforeAll(async (done) => {
        await exec('npm run db:down');
        await exec('npm run db:general:up');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');
        await exec('npm run db:project:up');
        await exec('npm run db:proj_parti:up');
        await exec('npm run db:sprint:up');
        await exec('npm run db:issue:up');
        await exec('npm run db:parti_issue:up');
        await exec('npm run db:issue_history:up');

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
                                project_type: c.projectType,
                                project_lead: res.body.data.auth_user_id
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
                                done();
                            }); //end pre-requisite #3
                    }); //end pre-requisite #2
            }); //end pre-requisite #1
    });

    it('POST/ issues successfully', (done) => {
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
            });
    });

    it('POST/ sub issues successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                issue_name: c.issueName,
                issue_type: 'subtask',
                issue_priority: c.issuePriority,
                issue_status: c.issueStatus,
                reporter: 1,
                parent_issue_id: 1,
                issue_desc: c.projectDesc,
                issue_story_point: c.issueStoryPoint,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, 'subtask');
                assert.equal(body.issue_priority, c.issuePriority);
                assert.equal(body.issue_status, c.issueStatus);
                assert.equal(body.reporter, 1);
                assert.equal(body.project_id, projectId);
                assert.equal(body.parent_issue_id, 1);

                expect(body).to.have.property('project_id');
                expect(body).to.have.property('issue_name');
                expect(body).to.have.property('issue_type');
                expect(body).to.have.property('issue_priority');
                expect(body).to.have.property('issue_status');
                expect(body).to.have.property('issue_story_point');
                expect(body).to.have.property('issue_desc');
                expect(body).to.have.property('issue_priority');
                expect(body).to.have.property('reporter');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('POST/ issues fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues')
            .send({
                issue_name: c.issueName,
                issue_type: c.issueType,
                issue_priority: c.issuePriority,
                issue_status: c.issueStatus,
                issue_desc: c.projectDesc,
                issue_story_point: c.issueStoryPoint,
                reporter: 1,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/ issues fails due to invalid of issue_type', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                issue_name: c.issueName,
                issue_type: 'random type',
                issue_priority: c.issuePriority,
                issue_status: c.issueStatus,
                reporter: 1,
                issue_desc: c.projectDesc,
                issue_story_point: c.issueStoryPoint,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/ issues fails due to invalid of issue_status', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                issue_name: c.issueName,
                issue_type: c.issueType,
                issue_priority: c.issuePriority,
                issue_desc: c.projectDesc,
                issue_story_point: c.issueStoryPoint,
                issue_status: 'random status',
                reporter: 1,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/ issues fails due to invalid of issue_priority', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                issue_name: c.issueName,
                issue_type: c.issueType,
                issue_priority: 'random priority',
                issue_status: c.issueStatus,
                issue_desc: c.projectDesc,
                issue_story_point: c.issueStoryPoint,
                reporter: 1,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('GET/ issues successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const data = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(data.total_count, 1);
                assert.isFalse(data.has_more);
                const issues = data.issues;
                assert.instanceOf(issues, Array);
                assert.equal(issues[0].issue_name, c.issueName);
                assert.equal(issues[0].issue_type, 'task');
                assert.equal(issues[0].issue_priority, c.issuePriority);
                assert.equal(issues[0].issue_status, c.issueStatus);
                assert.equal(issues[0].issue_desc, c.issueDesc);
                assert.equal(issues[0].issue_story_point, c.issueStoryPoint);
                assert.equal(issues[0].reporter, 1);
                assert.equal(issues[0].project_id, projectId);
                assert.equal(issues[0].parent_issue_id);

                expect(issues[0]).to.have.property('project_id');
                expect(issues[0]).to.have.property('issue_id');
                expect(issues[0]).to.have.property('parent_issue_id');
                expect(issues[0]).to.have.property('issue_name');
                expect(issues[0]).to.have.property('issue_type');
                expect(issues[0]).to.have.property('issue_priority');
                expect(issues[0]).to.have.property('issue_status');
                expect(issues[0]).to.have.property('issue_story_point');
                expect(issues[0]).to.have.property('issue_desc');
                expect(issues[0]).to.have.property('reporter');
                expect(issues[0]).to.have.property('created_date');
                expect(issues[0]).to.have.property('updated_date');
                done();
            });
    });

    it('GET/ issues fails due to absence of jwt', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/issues')
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);
                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('issue_id');
                expect(body).to.not.have.property('parent_issue_id');
                expect(body).to.not.have.property('issue_name');
                expect(body).to.not.have.property('issue_type');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('issue_status');
                expect(body).to.not.have.property('reporter');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_desc');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('GET/:id issues successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const data = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);

                assert.equal(data.issue_name, c.issueName);
                assert.equal(data.issue_type, 'task');
                assert.equal(data.issue_priority, c.issuePriority);
                assert.equal(data.issue_status, c.issueStatus);
                assert.equal(data.issue_desc, c.issueDesc);
                assert.equal(data.issue_story_point, c.issueStoryPoint);
                assert.equal(data.reporter, 1);
                assert.equal(data.project_id, projectId);
                assert.equal(data.issue_id, 1);
                assert.equal(data.parent_issue_id);

                expect(data).to.have.property('project_id');
                expect(data).to.have.property('issue_id');
                expect(data).to.have.property('parent_issue_id');
                expect(data).to.have.property('issue_name');
                expect(data).to.have.property('issue_type');
                expect(data).to.have.property('issue_priority');
                expect(data).to.have.property('issue_status');
                expect(data).to.have.property('issue_story_point');
                expect(data).to.have.property('issue_desc');
                expect(data).to.have.property('reporter');
                expect(data).to.have.property('created_date');
                expect(data).to.have.property('updated_date');
                done();
            });
    });

    it('GET/:id issues fails due to absence of jwt', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/issues/1')
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);
                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('issue_id');
                expect(body).to.not.have.property('parent_issue_id');
                expect(body).to.not.have.property('issue_name');
                expect(body).to.not.have.property('issue_type');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('issue_status');
                expect(body).to.not.have.property('reporter');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_desc');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/ issues successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                issue_name: c.issueName,
                issue_desc: c.issueDesc
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, 'task');
                assert.equal(body.issue_priority, c.issuePriority);
                assert.equal(body.issue_status, c.issueStatus);
                assert.equal(body.issue_desc, c.issueDesc);
                assert.equal(body.issue_story_point, c.issueStoryPoint);
                assert.equal(body.reporter, 1);

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
            });
    });

    it('PUT/:id issues fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/1')
            .send({issue_name: c.issueName})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/:id issues fails due to invalid of issue_type', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({issue_type: 'random type'})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/:id issues fails due to invalid of issue_status', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({issue_status: 'random status'})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/:id issues fails due to invalid of issue_priority', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({issue_priority: 'random priority'})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/reporter/:id issues successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/reporter/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({reporter: 1})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, 'task');
                assert.equal(body.issue_priority, c.issuePriority);
                assert.equal(body.issue_status, c.issueStatus);
                assert.equal(body.issue_desc, c.issueDesc);
                assert.equal(body.issue_story_point, c.issueStoryPoint);
                assert.equal(body.reporter, 1);

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
            });
    });

    it('PUT/reporter/:id issues fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/reporter/1')
            .send({reporter: 1})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/reporter/:id issues fails due to invalid reporter id', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/reporter/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({reporter: 10})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/assignee/:id issues successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues/assignee/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({assignee: 1})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                done();
            });
    });

    it('POST/assignee/:id issues fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues/assignee/1')
            .send({assignee: 1})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/assignee/:id issues fails due to invalid reporter id', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues/assignee/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({assignee: 10})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('DELETE/assignee/:id issues successfully', (done) => {
        chai.request('localhost:3000')
            .delete('/api/v1/issues/assignee/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({assignee: 1})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.isTrue(res.body.data.deleted);
                assert.isNotEmpty(res.body.data.assignee);
                done();
            });
    });

    it('DELETE/assignee/:id issues fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .delete('/api/v1/issues/assignee/1')
            .send({assignee: 1})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('project_id');
                expect(body).to.not.have.property('project_name');
                expect(body).to.not.have.property('project_desc');
                expect(body).to.not.have.property('project_type');
                expect(body).to.not.have.property('project_lead');
                expect(body).to.not.have.property('issue_story_point');
                expect(body).to.not.have.property('issue_priority');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('DELETE/assignee/:id issues fails due to invalid reporter id', (done) => {
        chai.request('localhost:3000')
            .delete('/api/v1/issues/assignee/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({assignee: 10})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                done();
            });
    });

    it('DELETE/:id issues successfully', (done) => {
        chai.request('localhost:3000')
            .delete('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({assignee: 1})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.isTrue(res.body.data.deleted);
                assert.isNotEmpty(res.body.data.issue);
                done();
            });
    });

    it('DELETE/:id fails due to invalid issue id', (done) => {
        chai.request('localhost:3000')
            .delete('/api/v1/issues/10')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({assignee: 1})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isFalse(res.body.data.deleted);
                done();
            });
    });
});

describe('tests /issues endpoint which assigns an issue to a sprint', () => {
    let accessToken;
    let projectId, sprintId;
    beforeAll(async (done) => {
        await exec('npm run db:down');
        await exec('npm run db:general:up');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');
        await exec('npm run db:project:up');
        await exec('npm run db:proj_parti:up');
        await exec('npm run db:sprint:up');
        await exec('npm run db:issue:up');
        await exec('npm run db:parti_issue:up');
        await exec('npm run db:issue_history:up');

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
                                    .post('/api/v1/sprints')
                                    .set('Authorization', `Bearer ${accessToken}`)
                                    .send({
                                        sprint_name: c.sprintName,
                                        sprint_goal: c.sprintGoals,
                                        start_date: c.sprintStartDate,
                                        end_date: c.sprintEndDate,
                                        project_id: projectId
                                    })
                                    .end((err, res) => {
                                        const body = res.body.data;
                                        assert.equal(res.body.status, 201);
                                        assert.isNotEmpty(res.body.data);
                                        sprintId = body.sprint_id;
                                        assert.equal(body.sprint_name, c.sprintName);
                                        assert.equal(body.sprint_goal, c.sprintGoals);

                                        expect(body).to.have.property('sprint_id');
                                        expect(body).to.have.property('sprint_name');
                                        expect(body).to.have.property('sprint_goal');
                                        expect(body).to.have.property('start_date');
                                        expect(body).to.have.property('end_date');
                                        expect(body).to.have.property('created_date');
                                        expect(body).to.have.property('updated_date');
                                        done();
                                    });
                            }); //end pre-requisite #3
                    }); //end pre-requisite #2
            }); //end pre-requisite #1
    });

    it('POST/ issues and assigns to a sprint successfully', (done) => {
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
                sprint_id: sprintId,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, 'task');
                assert.equal(body.issue_priority, c.issuePriority);
                assert.equal(body.issue_status, c.issueStatus);
                assert.equal(body.issue_desc, c.issueDesc);
                assert.equal(body.issue_story_point, c.issueStoryPoint);
                assert.equal(body.reporter, 1);
                assert.equal(body.project_id, projectId);
                assert.equal(body.sprint_id, sprintId);
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
            });
    });

    it('PUT/ issues successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                sprint_id: sprintId
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, 'task');
                assert.equal(body.issue_priority, c.issuePriority);
                assert.equal(body.issue_status, c.issueStatus);
                assert.equal(body.issue_desc, c.issueDesc);
                assert.equal(body.issue_story_point, c.issueStoryPoint);
                assert.equal(body.reporter, 1);
                assert.equal(body.sprint_id, sprintId);

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
            });
    });
})
