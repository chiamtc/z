import {Router} from 'express';
import HttpResponse from "../../../../../../utils/HttpResponse";
import PureMinio_Admin from "../../../../models/storage/minio/minio/admin";
import {ErrorHandler} from "../../../../../../utils/ErrorHandler";
import ResponseFlag from "../../../../../../constants/response_flag";
import Formidable from 'formidable'
import fs from 'fs';
import util from 'util';

const MinioStorage_Admin_Router = Router();

const admin = new PureMinio_Admin();
const ResponseUtil = new HttpResponse();
MinioStorage_Admin_Router.post('/', async (req, res) => {
    try {
        const bucket_creation = await admin.create(req.body.bucket_name.toLowerCase());
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
        const buckets = await admin.list_buckets();
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
        const deletedBucket = await admin.delete_bucket(req.params.bucketName.toLowerCase());
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
    const form = new Formidable();
    //TODO tidy this shit up
    const unlink = util.promisify(fs.unlink);
    form.parse(req, async (err, fields, files) => {
        const myfile = files.files_1;
        const a = await admin.upload_file(myfile);
        console.log('a', a)
        await unlink(files.files_1.path);
        // fs.unlink(files.files_1.path, (err) => {
        //     if(err){ console.log(err); }
        //     console.log('temp file deleted')
        // });
        ResponseUtil.setResponse(200, ResponseFlag.OK, {
            uploaded: true,
            fileName: files.files_1.name,
            location: `bucket1`,
            fileSize: `${files.files_1.size} bytes`
        });
        ResponseUtil.responds(res);
    });
});

export default MinioStorage_Admin_Router;
