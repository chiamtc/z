import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
const exec = util.promisify(require('child_process').exec);
import ResponseFlag from "../constants/response_flag";
chai.use(chaiHttp);

describe('tests /signup endpoint', () => {
    beforeAll(async () => {
        await exec('npm run db:down');
        await exec('npm run db:user:up');
    });

    it('signup successfully', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/signup')
            .send({email: 'abc@abc.com', username: 'a', password: 'b'})
            .end((err, res) => {
                const body = res.body.data;
                assert.equal(res.body.status, 201);
                assert.isNotEmpty(res.body.data);
                assert.equal(body.email, 'abc@abc.com');
                assert.equal(body.username, 'a');

                expect(body).to.have.property('auth_user_id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('username');
                expect(body).to.have.property('created_date');
                expect(body).to.have.property('updated_date');
                done();
            });
    })

    it('signs up with same credentials and fails', (done) => {
        chai.request('localhost:3000')
            .post('/api/v1/users/signup')
            .send({email: 'abc@abc.com', username: 'a', password: 'b'})
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 500);
                assert.equal(body.message, ResponseFlag.USER_EXISTS_IN_DATABASE);

                expect(body).to.not.have.property('auth_user_id');
                expect(body).to.not.have.property('email');
                expect(body).to.not.have.property('username');
                expect(body).to.not.have.property('created_date');
                expect(body).to.not.have.property('updated_date');

                expect(body).to.have.property('message');
                done();
            });
    })
})
