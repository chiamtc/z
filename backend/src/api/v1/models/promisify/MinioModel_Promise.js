import minio_client from "../storage/minio/minio/setup";
import util from "util";

export default class MinioModel_Promise {
    constructor() {
    }

    makeBucket() {
        return util.promisify((bucket_name, cb) => minio_client.makeBucket(bucket_name, (err) => cb(err)))
    }

    listBuckets() {
        return util.promisify((cb) => minio_client.listBuckets((err, ...results) => cb(err, results[0])));
    }

    removeBucket() {
        return util.promisify((bucket_name, cb) => minio_client.removeBucket(bucket_name, (err) => cb(err)));
    }

    bucketExists() {
        return util.promisify((bucket_name, cb) => minio_client.bucketExists(bucket_name, (err, exists) => cb(err, exists)));
    }


    putObject() {
        return util.promisify((bucket_name, file_name, file_stream, file_size, cb) => minio_client.putObject(bucket_name, file_name, file_stream, file_size, (err, etag) => cb(err, etag)));
    }

    getObject(bucket, file_name) {
        return new Promise((resolve, reject) => {
            let data;
            minio_client.getObject(bucket, file_name, (err, dataStream) => {
                if (err) reject(err);
                dataStream.on('data', (chunk) => data = !data ? Buffer.from(chunk) : Buffer.concat([data, chunk]));
                dataStream.on('end', () => resolve(data));
                dataStream.on('error', (err) => reject(err))
            });
        });
    }
}
