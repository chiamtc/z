import chai, {assert, expect} from "chai";
import _ from "lodash";
import util from 'util';
const exec = util.promisify(require('child_process').exec);
import * as c from '../../../../utils/constants'
import chaiHttp from "chai-http";

chai.use(chaiHttp);
describe('tests /permissions endpoint', ()=> {
    let accessToken;
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
                        done();
                    });
            });
    });

    it('GET/ permission successfully', (done)=>{
        chai.request('localhost:3000')
            .get('/api/v1/permissions')
            .set('Authorization', `Bearer ${accessToken}`)
            .end((err, res) => {
                const body = res.body;
                assert.equal(body.status, 200);
                const permissions = res.body.data.permissions;
                assert.equal(permissions.length, 16);

                done();
            });
    })
});
