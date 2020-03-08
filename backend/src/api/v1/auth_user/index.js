import {Router} from 'express';
import passport from 'passport';
import UserController from "./controller";
import db from '../../../db'
import RequestResponse_Helper from "../../../utils/RequestResponse_Helper";
const AuthUserRouter = Router();

AuthUserRouter.get('/', (req, res) => {
    res.status(200).json({message: 'respond with a resource'});
});

AuthUserRouter.post('/signup', async (req, res) => {
    const client = await db.client();
    const body = RequestResponse_Helper.extract_request_header(req);
    /*
    insert into auth_user (primary_email, auth_user_username, auth_user_password)
select 'abc@abc.com', 'abc', '123' where not exists (select * from auth_user where primary_email ='abc@abc.com')
     */
    const searchUser_Q = await client.query('SELECT * from  auth_user where primary_email=$1', [body.username]);
    console.log(searchUser_Q)
    // if (searchUser_Q.rows.length === 0) {
    //
    // } else {
    // }
    res.status(200).json('pass')
});

AuthUserRouter.post('/login', passport.authenticate('login', {
    session: false,
    failWithError: true
}), UserController.login);

export default AuthUserRouter;
