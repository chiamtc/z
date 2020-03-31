import Formidable_Promise from "../../../../models/promisify/Formidable_Promise";
import ResponseFlag from "../../../../../../constants/response_flag";
import {ErrorHandler} from "../../../../../../utils/ErrorHandler";
import HttpResponse from "../../../../../../utils/HttpResponse";

const ResponseUtil = new HttpResponse();
export default class FileChecker {
    constructor() {
    }

    async check_file_size(req, res, next) {
        try {
            const formidableModel = new Formidable_Promise({maxFileSize: parseInt(process.env.MINIO_FILE_SIZE_LIMIT)});
            const {files} = await formidableModel.parse()(req);

            if (Object.keys(files).length > 1) {
                ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: Only 1 file per request.`);
                ResponseUtil.responds(res);
            } else {
                req.file = files[Object.keys(files)];
                next();
            }
        } catch (e) {
            ResponseUtil.setResponse(500, ResponseFlag.STORAGE_API_ERROR, `Storage Error: File size exceeds 5MB limit`);
            ResponseUtil.responds(res);
        }
    }
}
