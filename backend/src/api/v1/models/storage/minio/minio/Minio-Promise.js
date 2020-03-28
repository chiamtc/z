import minio_client from "./setup";
import util from "util";

export default class MinioPromise {
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

    putObject() {
        return util.promisify((bucket_name, file_name, file_stream, file_size, cb) => minio_client.putObject(bucket_name, file_name, file_stream, file_size, (err, etag) => cb(err, etag)));
    }
}
