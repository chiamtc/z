import util from 'util';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
const exec = util.promisify(require('child_process').exec);

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
})
