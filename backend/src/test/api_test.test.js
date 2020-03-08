import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import app from "../server";
import {execFile, exec} from 'child_process'

chai.use(chaiHttp);

describe('testing login endpoint', () => {
    let tapp;

    beforeAll((done) => {
        exec('npm run db:down', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            done();
        });
    })

    beforeEach(() => {
        tapp = app.listen(3000, () => {
            console.log('test server is up')
        })
    });

    it('should be fine', (done) => {
        chai.request(tapp)
            .post('/api/v1/user/login')
            .send({username: 'a', password: 'b'})
            .end((err, res) => {
                // console.log('err', err)
                console.log('res', res.body);
                done();
            });
    })
})
