import util from 'util';
import fs from 'fs';
import chai, {assert, expect} from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash';
import * as c from "../../../../../../utils/constants";

chai.use(chaiHttp);
describe('Minio test suite', () => {
    let accessToken;

    beforeAll(async (done) => {
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
                    })
            });
    });

    it('tests uploading a picture', (done) => {
        const f = fs.readFileSync('/Users/chiamtc/aidaNewMini.png')
        chai.request('localhost:3000')
            .post('/api/v1/storage/minio/admin/upload')
            .set('Authorization', `Bearer ${accessToken}`)
            .attach('files_1', f, 'aidaNewMini.png')
            .end((err, res) => {
                console.log(err)
                console.log(res);
                done();
            })
    })
});
