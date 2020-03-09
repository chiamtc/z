import LocalStrategy from 'passport-local';
import db from "../db";
import bcrypt from "bcrypt";
import {ErrorHandler} from "../utils/ErrorHandler";

const initializePassport = (passport) => {
    passport.use('login', new LocalStrategy(
        async (username, password, done) => {
            try {
                const client = await db.client();
                await client.query('begin');

                const searchUser_Q = `select * from auth_user where username = $1`;
                const searchUser_Q_values = [username];
                const searchUser_R = await client.query(searchUser_Q, searchUser_Q_values);

                const match = await bcrypt.compare(password, searchUser_R.rows[0].password);
                console.log(match);
                if (match) {
                    const updateLastLogin_Q = `update auth_user set last_login=$1 where auth_user_id = $2 RETURNING auth_user_id, email, created_date, updated_date, last_login`;
                    const updateLastLogin_Q_values = [new Date(), searchUser_R.rows[0].auth_user_id];
                    const updateLastLogin_R = await client.query(updateLastLogin_Q, updateLastLogin_Q_values);
                    client.query('commit');
                    return done(null, updateLastLogin_R.rows[0]);
                } else {
                    done(new ErrorHandler(401, 'error', 'Invalid password for user'), false);
                }
            } catch (e) {
                return done(500, e)
            }
        }
    ))
}
export default initializePassport;
