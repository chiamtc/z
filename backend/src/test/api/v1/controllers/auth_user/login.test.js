import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';

const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import ResponseFlag from "../../../../../constants/response_flag";

chai.use(chaiHttp);

describe('tests /login endpoint', () => {
    beforeAll(async (done) => {
        await exec('npm run db:down');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');

        chai.request('localhost:3000')
            .post('/api/v1/users/signup')
            .send({email: c.email, username: c.username, password: c.password, firstName:c.firstName, lastName:c.lastName})
            .end((err, res) => {
                console.log(_.isEmpty(res.body) ? null : 'user signed up successfully in login test beforeAll hook')
                done();
            });
    });

    it('login successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/login')
            .send({username: c.username, password: c.password})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 200);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.email, c.email);

                expect(body).to.have.property('auth_user_id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                expect(body).to.have.property('last_login');
                //TODO: assert and expect jwt token later
                done();
            })
    });

    it('login with mismatch password', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/login')
            .send({username: c.username, password: 'randomPw'})
            .end((err, res) => {
                const body = res.body;
                assert.equal(res.body.status, 500);
                assert.equal(body.message, ResponseFlag.INVALID_CREDENTIALS);

                expect(body).to.not.have.property('auth_user_id');
                expect(body).to.not.have.property('email');
                expect(body).to.not.have.property('username');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                expect(body).to.not.have.property('last_login');
                done();
            })
    });

    it('login with username that doesn"t exist', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/login')
            .send({username: 'randomUsername', password: 'randomPw'})
            .end((err, res) => {
                const body = res.body;
                assert.equal(res.body.status, 500);
                assert.equal(body.message, ResponseFlag.INVALID_CREDENTIALS);

                expect(body).to.not.have.property('auth_user_id');
                expect(body).to.not.have.property('email');
                expect(body).to.not.have.property('username');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                expect(body).to.not.have.property('last_login');
                done();
            })
    });

    it('login without username and password', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/login')
            .send({})
            .end((err, res) => {
                const body = res.body;
                assert.equal(res.body.status, 500);
                assert.equal(body.message, ResponseFlag.INVALID_CREDENTIALS);

                expect(body).to.not.have.property('auth_user_id');
                expect(body).to.not.have.property('email');
                expect(body).to.not.have.property('username');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                expect(body).to.not.have.property('last_login');
                done();
            })
    });
});
