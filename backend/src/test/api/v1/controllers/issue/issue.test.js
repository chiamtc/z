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
        await exec('npm run db:issue:up');
        await exec('npm run db:history:up');

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

    it('POST/ issues successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                issue_name: c.issueName,
                issue_type: c.issueType,
                issue_priority: c.issuePriority,
                issue_status: c.issueStatus,
                reporter: 1,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, c.issueType);
                assert.equal(body.issue_priority, c.issuePriority);
                assert.equal(body.issue_status, c.issueStatus);
                assert.equal(body.reporter, 1);
                assert.equal(body.project_id, projectId);
                assert.isNull(body.parent_issue_id);

                expect(body).to.have.property('project_id');
                expect(body).to.have.property('issue_id');
                expect(body).to.have.property('parent_issue_id');
                expect(body).to.have.property('issue_name');
                expect(body).to.have.property('issue_type');
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
                issue_type: c.issueType,
                issue_priority: c.issuePriority,
                issue_status: c.issueStatus,
                reporter: 1,
                parent_issue_id:1,
                project_id: projectId
            })
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.issue_name, c.issueName);
                assert.equal(body.issue_type, c.issueType);
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
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });
});