import minio_client from "./setup";
import fs from "fs";
import util from 'util';
import MinioPromise from "./Minio-Promise";

export default class PureMinio_Admin {
    constructor() {
        this.minio_promise = new MinioPromise();
    }

    async create(bucket_name) {
        const mb = this.minio_promise.makeBucket();
        return await mb(bucket_name);
    }

    async list_buckets() {
        const lb = this.minio_promise.listBuckets();
        return await lb();
    }

    async delete_bucket(bucket_name) {
        const rb = this.minio_promise.removeBucket();
        return await rb(bucket_name);
    }

    async upload_file(file) {
        var fileStream = fs.createReadStream(file.path);
        const fsStat = util.promisify(fs.stat);
        const stat = await fsStat(file.path);
        const po = this.minio_promise.putObject();
        return await po('bucket1', file.name, fileStream, stat.size);
    }

    error_handler(reject, ops, err) {
        console.log(`minio admin > ${ops} `, err)
        reject('Error creating a bucket', err)
    }
}
/*
     from
     function awkwardFunction (options, data, callback) {
         // do stuff ...
         let item = "stuff message"
         return callback(null, response, item)
     }
         to

     let kptest = require('util').promisify(
                   (options, data, cb) => awkwardFunction(
                     options,
                     data,
                     (err, ...results) => cb(err, results)
                   )
                 )
      */
