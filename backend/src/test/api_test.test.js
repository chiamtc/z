import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import app from "../server";

chai.use(chaiHttp);

describe('testing login endpoint', () => {
    let tapp;
    beforeEach(() => {
        tapp = app.listen(3000, () => {
            console.log('test server is up')
        })
    })
    it('should be fine', (done) => {
        chai.request(tapp)
            .post('/api/v1/user/login')
            .send({username:'a', password:'b'})
            .end((err, res) => {
                console.log('err', err)
                console.log('res', res);
                done();
            });
    })
})
