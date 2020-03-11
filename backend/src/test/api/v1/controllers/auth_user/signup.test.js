import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import * as c from '../../../../utils/constants';

const exec = util.promisify(require('child_process').exec);
import ResponseFlag from "../../../../../constants/response_flag";

chai.use(chaiHttp);

describe('tests /signup endpoint', () => {
    beforeAll(async () => {
        await exec('npm run db:down');
        await exec('npm run db:general:up');
        await exec('npm run db:user:up');
        await exec('npm run db:person:up');
    });

    it('signs up successfully', (done) => {
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
                const body = res.body.data;
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.email, c.email);
                assert.equal(body.first_name, c.firstName);
                assert.equal(body.last_name, c.lastName);

                expect(body).to.have.property('auth_user_id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                expect(body).to.have.property('first_name');
                expect(body).to.have.property('last_name');
                done();
            });
        //TODO: add GET person endpoint to check if person is created after user has signed up successfully
        /*chai.request('localhost:3000')
            .post('/api/v1/users/signup')*/
    })

    it('signs up with same credentials and fails', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/signup')
            .send({email: c.email, username: c.username, password: c.password})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);
                assert.equal(body.message, ResponseFlag.USER_EXISTS_IN_DATABASE);

                expect(body).to.not.have.property('auth_user_id');
                expect(body).to.not.have.property('email');
                expect(body).to.not.have.property('username');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');
                expect(body).to.not.have.property('first_name');
                expect(body).to.not.have.property('last_name');

                expect(body).to.have.property('message');
                done();
            });
    })
})
