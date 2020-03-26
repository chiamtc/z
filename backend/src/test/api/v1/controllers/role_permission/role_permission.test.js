import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';

const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";


chai.use(chaiHttp);
describe('tests /roles endpoint', () => {
    let accessToken, projectId, roleId;

    beforeAll(async (done) => {
        await exec('npm run db:down');
        await exec('npm run db:general:up');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');
        await exec('npm run db:project:up');
        await exec('npm run db:role:up');
        await exec('npm run db:permission:up');
        await exec('npm run db:role-permission:up');
        await exec('npm run db:proj_parti:up');
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
                console.log(_.isEmpty(res.body) ? null : 'user signed up successfully in login test beforeAll hook')
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
                                console.log(res.body);
                                projectId = res.body.data.project_id;
                                chai.request('localhost:3000')
                                    .post('/api/v1/roles')
                                    .set('Authorization', `Bearer ${accessToken}`)
                                    .send({
                                        role_name: c.role_name,
                                        description: c.description,
                                        project_id: projectId
                                    })
                                    .end((err, res) => {
                                        const body = res.body.data;
                                        assert.equal(res.body.status, 201);
                                        assert.isNotEmpty(res.body.data);
                                        assert.equal(body.description, c.description);
                                        assert.equal(body.role_name, c.role_name);
                                        roleId = body.role_id;
                                        expect(body).to.have.property('project_id');
                                        expect(body).to.have.property('role_name');
                                        expect(body).to.have.property('role_id');
                                        expect(body).to.have.property('description');
                                        expect(body).to.have.property('created_date');
                                        expect(body).to.have.property('updated_date');
                                        done();
                                    });
                            })
                    })
            });
    });

    it('POST/ role_permission successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/role_permission')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                role_id:roleId,
                permission_id: 1
            })
            .end((err, res) => {
                const body = res.body.data;
                console.log(res.body);
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.permission_id, 1);
                assert.equal(body.role_id, roleId);


                expect(body).to.have.property('role_id');
                expect(body).to.have.property('permission_id');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });

    it('POST/ role_permission fails due to invalid role_id', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/role_permission')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                role_id:999,
                permission_id: 1
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(res.body.status, 500);
                expect(body).to.have.property('message');
                expect(body).to.not.have.property('role_id');
                expect(body).to.not.have.property('permission_id');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('POST/ role_permission fails due to invalid permission_id', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/role_permission')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                role_id:1,
                permission_id: 999
            })
            .end((err, res) => {
                const body = res.body;
                assert.equal(res.body.status, 500);
                expect(body).to.have.property('message');
                expect(body).to.not.have.property('role_id');
                expect(body).to.not.have.property('permission_id');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                done();
            });
    });

    it('PUT/ role_permission successfully', (done) => {
        chai.request('localhost:3000')
            .put(`/api/v1/role_permission/${roleId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                role_id:roleId,
                permission_id: 2
            })
            .end((err, res) => {
                const body = res.body.data;
                console.log(res.body);
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.permission_id, 1);
                assert.equal(body.role_id, roleId);


                expect(body).to.have.property('role_id');
                expect(body).to.have.property('permission_id');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    });
});
