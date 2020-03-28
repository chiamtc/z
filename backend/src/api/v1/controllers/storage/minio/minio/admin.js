import {Router} from 'express';
import HttpResponse from "../../../../../../utils/HttpResponse";
import PureMinio_Admin from "../../../../models/storage/minio/minio/admin";
import {ErrorHandler} from "../../../../../../utils/ErrorHandler";
import ResponseFlag from "../../../../../../constants/response_flag";
import Formidable from 'formidable'
import fs from 'fs';
import util from 'util';
import bytes from 'bytes';
import minio_client from "../../../../models/storage/minio/minio/setup";

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
    try {
        const unlink = util.promisify(fs.unlink);
        form.parse(req, async (err, fields, files) => {
            const myfile = files.files_1;
            await admin.upload_file(myfile);
            await unlink(myfile.path);

            var size = 0
            let data;
            /*
            //source:https://gist.github.com/nesimtunc/fe46687589a6940fbe941dee99d3ba89
            minio_client.getObject('bucket1', files.files_1.name, function(err, dataStream) {
                if (err) {
                    return console.log(err)
                }
               dataStream.on('data', function(chunk) {
                    size += chunk.length
                    data = !data ? new Buffer(chunk) : Buffer.concat([data, chunk]);
                })
                dataStream.on('end', function() {
                    console.log('End. Total size = ' + size)
                    res.writeHead(200, {'Content-Type': 'image/jpeg'});
                    res.write(data);
                    res.end();

                })
                dataStream.on('error', function(err) {
                    console.log(err)
                })
              // dataStream.pipe(res); //source: https://www.thepolyglotdeveloper.com/2017/03/upload-files-minio-object-storage-cloud-node-js-multer/
            })*/

            ResponseUtil.setResponse(200, ResponseFlag.OK, {
                uploaded: true,
                fileName: files.files_1.name,
                location: `bucket1`,
                fileSize: `${bytes(files.files_1.size)}`,
                linkUrl: `localhost:3001/bucket1/${files.files_1.name}` //source: https://github.com/minio/minio-js/issues/588
            });
            ResponseUtil.responds(res);
        });
    } catch (e) {
        console.log('e', e);
        ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: ${e.message}. Note: bucket_name can only be lowercase alphanumeric without special case`);
        ResponseUtil.responds(res);
    }
});

export default MinioStorage_Admin_Router;
