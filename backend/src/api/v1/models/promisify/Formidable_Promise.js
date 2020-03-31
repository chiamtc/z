import Formidable from 'formidable';
import util from 'util';
import fs from 'fs';

export default class FormidableModel_Promise {
    constructor(opts) {
        this.formidable = new Formidable(opts);
    }

    parse() {
        return util.promisify((req, cb) => this.formidable.parse(req, (err, fields, files) => cb(err, {
            ...fields,
            files: {...files}
        })));
    }

    async delete_temp_file(temp_file) {
        const unlink = util.promisify(fs.unlink);
        return await unlink(temp_file);
    }
}
