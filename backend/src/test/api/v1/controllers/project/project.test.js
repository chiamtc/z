import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';

const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";

chai.use(chaiHttp);
describe('tests /me endpoint', () => {
    let accessToken;
    beforeAll(async (done) => {
        await exec('npm run db:down');
        await exec('npm run db:general:up');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');
        await exec('npm run db:project:up');
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
                        //TODO: assert and expect jwt token later
                        done();
                    })
            });
    });

    it('POST/ project successfully', (done) => {
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
            });
    })

    it('POST/ project fails due to invalid enum', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/projects')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                project_name: c.projectName,
                project_desc: c.projectDesc,
                project_type: 'RANDOM_TYPE'
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
            })
    })

    it('POST/ project fails due to absence of jwt', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/projects')
            .send({
                project_name: c.projectName,
                project_desc: c.projectDesc,
                project_type: c.projectType
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
            })
    })
});
