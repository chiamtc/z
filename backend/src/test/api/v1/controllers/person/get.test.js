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
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');

        chai.request('localhost:3000')
            .post('/api/v1/users/signup')
            .send({
                email: c.email,
                username: c.username,
                password: c.password,
                firstName: c.firstName,
                lastName: c.lastName
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

    it('GET /:id with existing ID successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/persons/1 ')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.email, c.email);
                assert.equal(body.first_name, c.firstName);
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

    it('GET /:id  without existing ID successfully', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/persons/2 ')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                assert.equal(res.body.status, 404);
                assert.equal(res.body.data, ResponseFlag.OBJECT_NOT_FOUND);
                done();
            })
    });

    it('GET /me fails due to absence of jwt token', (done) => {
        chai.request('localhost:3000')
            .get('/api/v1/persons/me')
            .end((err, res) => {
                assert.equal(res.body.status, 500);
                assert.equal(res.body.message, ResponseFlag.JWT_TOKEN_ERROR);
                done();
            })
    })
})
