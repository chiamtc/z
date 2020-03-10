import LocalStrategy from 'passport-local';
import db from "../db";
import bcrypt from "bcrypt";
import {ErrorHandler} from "../utils/ErrorHandler";
import ResponseFlag from "../constants/response_flag";
import jwt from 'jsonwebtoken';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';

const initializePassport = (passport) => {
    passport.use('login', new LocalStrategy(
        async (username, password, done) => {
            const client = await db.client();
            try {
                await client.query('begin');

                const searchUser_Q_values = [username];
                const searchUser_Q = `select * from auth_user where username = $1`;
                const searchUser_R = await client.query(searchUser_Q, searchUser_Q_values);
                if (searchUser_R.rows.length !== 0) {
                    const match = await bcrypt.compare(password, searchUser_R.rows[0].password);
                    if (match) {
                        const updateLastLogin_Q_values = [new Date(), searchUser_R.rows[0].auth_user_id];
                        const updateLastLogin_Q = `update auth_user set last_login=$1 where auth_user_id = $2 RETURNING auth_user_id, email, created_date, updated_date, last_login`;
                        const updateLastLogin_R = await client.query(updateLastLogin_Q, updateLastLogin_Q_values);
                        client.query('commit');

                        const jwt_accessToken = jwt.sign({auth_user_id: updateLastLogin_R.rows[0].auth_user_id}, process.env.JWT_SECRET, {expiresIn: `${process.env.JWT_EXPIRATION}h`});
                        return done(null, {...updateLastLogin_R.rows[0], accessToken: jwt_accessToken});
                    } else return done(new ErrorHandler(401, ResponseFlag.AUTH_ERROR, ResponseFlag.INVALID_CREDENTIALS), false);
                } else return done(new ErrorHandler(401, ResponseFlag.AUTH_ERROR, ResponseFlag.INVALID_CREDENTIALS), false);
            } catch (e) {
                await client.query('rollback');
                return done(null, false, {message: "Invalid ?"})
            } finally {
                client.release()
            }
        }
    ));

    passport.use('jwt', new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Bearer'),
        secretOrKey: process.env.JWT_SECRET
    }, async (jwt_payload, done) => {
        try {
            const searchUser_Q_values = [jwt_payload.auth_user_id];
            const searchUser_Q = ` select * from auth_user where auth_user_id = $1`;
            const {rows} = await db.query(searchUser_Q, searchUser_Q_values);
            done(null, rows[0]);
        } catch (e) {
            done(null, false, {message: 'Invalid ?'})
        }
    }))
}
export default initializePassport;
