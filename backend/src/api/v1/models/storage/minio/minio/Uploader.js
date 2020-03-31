/*
    steps
    1. use formidable_promise model to parse the req
    2. get endpoint and files from parse()
    3. use minio_promise model to putObject into minio storage server
    4. delete temp file via formidableModel
    5. use minio_promis emodel to return the arraybuffer of file to front-end
 */
import Formidable_Promise from "../../../promisify/Formidable_Promise";
import MinioModel from "./MinioModel";

export default class Uploader {
    constructor() {
        this.minioModel = new MinioModel();
        this.formidableModel = new Formidable_Promise();
    }

    async uploads(bucket,req) {
        //step 1 & 2
        const file =req.file;
        const {bucket_path} = req;
        //step 3
        const a = await this.minioModel.upload_file(bucket, `${bucket_path}/${file.name}`, file.path);
        // step 4
        await this.formidableModel.delete_temp_file(file.path);
        //step 5
        return await this.minioModel.get_object(bucket, `${bucket_path}/${file.name}`,`${file.name}`, file.type, file.size);
    }
}
