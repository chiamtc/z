import minio_client from "./setup";
import fs from "fs";
import util from 'util';

export default class PureMinio_Admin {
    cosntructor() {

    }

    async create(bucket_name) {
        const makeBucket = util.promisify((bucket_name, cb) => minio_client.makeBucket(bucket_name, (err) => cb(err)))
        return await makeBucket(bucket_name);
    }

    async list_buckets() {
        const listBuckets = util.promisify((cb) => minio_client.listBuckets((err, ...results) => cb(err, results[0])));
        return await listBuckets();
    }

    async delete_bucket(bucket_name) {
        const removeBucket = util.promisify((bucket_name, cb) => minio_client.removeBucket(bucket_name, (err) => cb(err)));
        return await removeBucket(bucket_name);
    }

    upload_file(file) {
        var fileStream = fs.createReadStream(file.path);
        return new Promise((resolve, reject) => {
            var fileStat = fs.stat(file.path, function (err2, stats) {
                if (err2) {
                    console.log('err2', err2)
                    reject(err2.message);
                }
                minio_client.putObject('bucket1', file.name, fileStream, stats.size, function (err3, etag) {
                    if (err3) {
                        console.log('err3', err3)
                        reject(err3.message);
                    }
                    resolve(etag);
                })
            });
        })
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
