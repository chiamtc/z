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

    it('GET /me successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/persons/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err,res)=>{
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.email, c.email);
                assert.equal(body.username, c.username);
                assert.equal(body.first_name, c.firstName);
                assert.equal(body.last_name, c.lastName);

                expect(body).to.have.property('auth_user_id');
                expect(body).to.have.property('person_id');
                expect(body).to.have.property('username');
                expect(body).to.have.property('email');
                expect(body).to.have.property('first_name');
                expect(body).to.have.property('last_name');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                expect(body).to.have.property('last_login');
                done();
            })
    })

    it('GET /me fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/persons/me')
            .end((err,res)=>{
                assert.equal(res.body.status, 500);
                assert.equal(res.body.message, ResponseFlag.JWT_TOKEN_ERROR);
                done();
            })
    });

    it('PUT /me successfully', (done)=>{
        chai.request('localhost:3000')
            .put('/api/v1/persons/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({'first_name': 'kappa'})
            .end((err,res)=>{
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.email, c.email);
                assert.equal(body.first_name, 'kappa');
                assert.equal(body.last_name, c.lastName);

                expect(body).to.have.property('auth_user_id');
                expect(body).to.have.property('person_id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('first_name');
                expect(body).to.have.property('last_name');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            })
    });

    it('PUT /me fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .put('/api/v1/persons/me')
            .send({'first_name': 'kappa'})
            .end((err,res)=>{
                assert.equal(res.body.status, 500);
                assert.equal(res.body.message, ResponseFlag.JWT_TOKEN_ERROR);
                done();
            })
    });
})
