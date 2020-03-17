import chai, {assert, expect} from "chai";
import _ from "lodash";
import util from 'util';
const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
describe('tests /histories endpoint', ()=>{
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
                                        assert.equal(res.body.status, 200);
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
                            }); //end pre-requisite #3
                    }); //end pre-requisite #2
            }); //end pre-requisite #1
    });

    it('GET/ issue histories successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/histories/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const data = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(data.total_count, 1);
                assert.isFalse(data.has_more);
                const histories = data.histories;
                assert.instanceOf(histories, Array);

                expect(histories[0]).to.have.property('history_id');
                expect(histories[0]).to.have.property('issue_id');
                expect(histories[0]).to.have.property('person_id');
                expect(histories[0]).to.have.property('history_action');
                expect(histories[0]).to.have.property('new_content');
                expect(histories[0]).to.have.property('old_content');
                expect(histories[0]).to.have.property('updated_content_type');
                done();
            });
    });

    it('GET/ issue histories fails due to absence of jwt', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/histories/1')
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);
                expect(body).to.have.property('message');
                expect(body).to.not.have.property('history_id');
                expect(body).to.not.have.property('issue_id');
                expect(body).to.not.have.property('person_id');
                expect(body).to.not.have.property('history_action');
                expect(body).to.not.have.property('new_content');
                expect(body).to.not.have.property('old_content');
                expect(body).to.not.have.property('updated_content_type');
                done();
            });
    });
})