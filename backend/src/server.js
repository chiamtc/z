import express from 'express';
import logger from 'morgan';
import APIRouter from './api/v1'

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/api/v1', APIRouter);

app.use(function(err, req, res, next) {
    //TODO transform this with error handler class
    res.status(err.status || 500).json({message:'invalid route'})
});
export default app;
