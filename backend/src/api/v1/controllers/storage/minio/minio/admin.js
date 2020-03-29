import {Router} from 'express';
import HttpResponse from "../../../../../../utils/HttpResponse";
import MinioModel from "../../../../models/storage/minio/minio/MinioModel";
import ResponseFlag from "../../../../../../constants/response_flag";
import Uploader from "../../../../models/storage/minio/minio/Uploader";

const MinioStorage_Admin_Router = Router();

const minioModel = new MinioModel();
const ResponseUtil = new HttpResponse();
MinioStorage_Admin_Router.post('/', async (req, res) => {
    try {
        const bucket_creation = await minioModel.create(req.body.bucket_name.toLowerCase());
        ResponseUtil.setResponse(201, ResponseFlag.OK, {bucket_name: req.body.bucket_name, created_date: new Date()});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}. Note: bucket_name can only be lowercase alphanumeric without special case`);
        ResponseUtil.responds(res);
    }
});

MinioStorage_Admin_Router.get('/buckets', async (req, res) => {
    try {
        const buckets = await minioModel.list_buckets();
        ResponseUtil.setResponse(200, ResponseFlag.OK, {buckets});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}. Note: bucket_name can only be lowercase alphanumeric without special case`);
        ResponseUtil.responds(res);
    }
});

MinioStorage_Admin_Router.delete('/buckets/:bucketName', async (req, res, next) => {
    try {
        const deletedBucket = await minioModel.delete_bucket(req.params.bucketName.toLowerCase());
        if (deletedBucket === undefined) {
            ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: true, bucket: req.params.bucketName});
        } else ResponseUtil.setResponse(200, ResponseFlag.OK, {deleted: false});
        ResponseUtil.responds(res);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}. Note: bucket_name can only be lowercase alphanumeric without special case`);
        ResponseUtil.responds(res);
    }
});

MinioStorage_Admin_Router.post('/upload', async (req, res, next) => {
    try {
        const uploader  = new Uploader();
        req.bucket_path = 'admin';
        const buffer = await uploader.uploads('bucket1',req);
        res.status(200).send(buffer);
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}.`);
        ResponseUtil.responds(res);
    }
});

export default MinioStorage_Admin_Router;
