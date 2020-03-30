import minio_client from "./setup";
import fs from "fs";
import util from 'util';
import MinioModel_Promise from "../../../promisify/MinioModel_Promise";

export default class MinioModel {
    constructor() {
        this.minio_promise = new MinioModel_Promise();
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

    async bucket_exists(bucket_name) {
        const be = this.minio_promise.bucketExists();
        return await be(bucket_name);
    }

    async upload_file(bucket, bucket_path_file_name, path) {
        var fileStream = fs.createReadStream(path);
        const fsStat = util.promisify(fs.stat);
        const stat = await fsStat(path);
        const po = this.minio_promise.putObject();
        return await po(bucket, `${bucket_path_file_name}`, fileStream, stat.size);
    }

    async get_object(bucket, file_path, file_name, mime_type, file_size) {
        return await this.minio_promise.getObject(bucket, file_path, file_name, mime_type,file_size);
    }

    async remove_object(bucket, file_name) {
        return await this.minio_promise.removeObject(bucket, file_name)
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
