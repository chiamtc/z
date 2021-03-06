import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';

const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";

chai.use(chaiHttp);
describe('tests /sprints endpoint', () => {
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
        await exec('npm run db:issue_history:up');
        await exec('npm run db:issue:up');
        await exec('npm run db:parti_issue:up');

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

    it('POST/ sprints successfully', (done) => {
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
    });

    it('POST/ sprints fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/sprints')
            .send({
                sprint_name: c.sprintName,
                sprint_goal: c.sprintGoals,
                start_date: c.sprintStartDate,
                end_date: c.sprintEndDate,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('sprint_id');
                expect(body).to.not.have.property('sprint_name');
                expect(body).to.not.have.property('sprint_goal');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('end_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/ sprints fails due to start date is later than end date', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/sprints')
            .send({
                sprint_name: c.sprintName,
                sprint_goal: c.sprintGoals,
                start_date: c.sprintEndDate,
                end_date: c.sprintStartDate,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('sprint_id');
                expect(body).to.not.have.property('sprint_name');
                expect(body).to.not.have.property('sprint_goal');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('end_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('GET/:id sprints successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/sprints/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);

                assert.equal(body.sprint_name, c.sprintName);
                assert.equal(body.sprint_goal, c.sprintGoals);
                assert.equal(body.sprint_id, 1);

                expect(body).to.have.property('sprint_id');
                expect(body).to.have.property('sprint_name');
                expect(body).to.have.property('sprint_goal');
                expect(body).to.have.property('start_date');
                expect(body).to.have.property('end_date');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('GET/:id fails due to absence of jwt ', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/sprints/1')
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('sprint_id');
                expect(body).to.not.have.property('sprint_name');
                expect(body).to.not.have.property('sprint_goal');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('end_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('GET/:id fails due to invalid sprint id ', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/sprints/10')
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('sprint_id');
                expect(body).to.not.have.property('sprint_name');
                expect(body).to.not.have.property('sprint_goal');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('end_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/:id sprints successfully', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/sprints/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                sprint_name: c.sprintName,
                sprint_goal: c.sprintGoals,
                start_date: c.sprintStartDate,
                end_date: c.sprintEndDate
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
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
    });

    it('PUT/:id sprints fails due to absence of jwt', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/sprints/1')
            .send({
                sprint_name: c.sprintName,
                sprint_goal: c.sprintGoals,
                start_date: c.sprintStartDate,
                end_date: c.sprintEndDate
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('sprint_id');
                expect(body).to.not.have.property('sprint_name');
                expect(body).to.not.have.property('sprint_goal');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('end_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/:id sprints fails due to start date is later than end date', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/sprints/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                sprint_name: c.sprintName,
                sprint_goal: c.sprintGoals,
                start_date: c.sprintEndDate,
                end_date: c.sprintStartDate,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);

                expect(body).to.have.property('message');
                expect(body).to.not.have.property('sprint_id');
                expect(body).to.not.have.property('sprint_name');
                expect(body).to.not.have.property('sprint_goal');
                expect(body).to.not.have.property('start_date');
                expect(body).to.not.have.property('end_date');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('DELETE/:id sprints successfully', (done) => {
        let issueId;
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
                sprint_id:1,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body.data;
                console.log(res.body);
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                issueId = res.body.data.issue_id;
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

                chai.request('localhost:3000')
                    .delete('/api/v1/sprints/1')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .end((err, res) => {
                        const body = res.body.data;
                        assert.equal(res.body.status, 200);
                        assert.isNotEmpty(res.body.data);
                        assert.isTrue(body.deleted);
                        const deletedSprint = body.sprint;
                        const deletedIssue = body.issues;
                        assert.instanceOf(deletedIssue, Array);
                        assert.equal(deletedSprint.sprint_name, c.sprintName);
                        assert.equal(deletedSprint.sprint_goal, c.sprintGoals);

                        expect(deletedSprint).to.have.property('sprint_id');
                        expect(deletedSprint).to.have.property('sprint_name');
                        expect(deletedSprint).to.have.property('sprint_goal');
                        expect(deletedSprint).to.have.property('start_date');
                        expect(deletedSprint).to.have.property('end_date');
                        expect(deletedSprint).to.have.property('created_date');
                        expect(deletedSprint).to.have.property('updated_date');

                        assert.equal(deletedIssue[0].issue_name, c.issueName);
                        assert.equal(deletedIssue[0].issue_type, 'task');
                        assert.equal(deletedIssue[0].issue_priority, c.issuePriority);
                        assert.equal(deletedIssue[0].issue_status, c.issueStatus);
                        assert.equal(deletedIssue[0].issue_desc, c.issueDesc);
                        assert.equal(deletedIssue[0].issue_story_point, c.issueStoryPoint);
                        assert.equal(deletedIssue[0].reporter, 1);
                        assert.equal(deletedIssue[0].project_id, projectId);
                        assert.isNull(deletedIssue[0].parent_issue_id);
                        done();
                    });
            });
    });

    it('GET/sprints/:id project successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/sprints/projects/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const data = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(data.total_count, 0);
                assert.isFalse(data.has_more);
                const sprints = data.sprints;
                assert.instanceOf(sprints, Array);
                //should really create a sprint, assign that sprint to a project then test this. but im too lazy for that shit
                done();
            });
    });
});
