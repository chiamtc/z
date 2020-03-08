import {Router} from 'express';
import passport from 'passport';
import UserController from "./controller";
import db from '../../../db'

const AuthUserRouter = Router();

AuthUserRouter.get('/', (req, res) => {
    res.status(200).json({message: 'respond with a resource'});
});

AuthUserRouter.post('/signup', async (req, res) => {
    const client = await db.client();

    const searchUser_Q = await client.query('SELECT * from  auth_user');
    if (searchUser_Q.rows.length === 0) {

    } else {
    }
});

AuthUserRouter.post('/login', passport.authenticate('login', {
    session: false,
    failWithError: true
}), UserController.login);

export default AuthUserRouter;
