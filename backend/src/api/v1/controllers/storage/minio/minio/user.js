import {Router} from 'express';
import HttpResponse from "../../../../../../utils/HttpResponse";
import minio_client from "../../../../models/storage/minio/minio/setup";

const MinioStorage_NormalUser_Router = Router();
MinioStorage_NormalUser_Router.post('/', async (req, res) => {
    res.status(200).json({res:'ok'})
});

export default MinioStorage_NormalUser_Router;
