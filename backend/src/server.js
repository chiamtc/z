import '../config/loadEnv';
import express from 'express';
import logger from 'morgan';
import APIV1Router from './api/v1'
import AuthStrategy from './auth';
import passport from 'passport';
const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/api/v1', APIV1Router);
AuthStrategy.localStrategy(passport);
app.use(passport.initialize());
app.use(function (err, req, res, next) {
    //TODO transform this with error handler class
    res.status(err.status || 500).json({message: 'invalid route'})
});
export default app;
