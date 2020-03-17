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
        await exec('npm run db:history:up');
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
                                project_type: c.projectType
                            })
                            .end((err, res) => {
                                const body = res.body.data;
                                assert.equal(res.body.status, 200);
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
});
