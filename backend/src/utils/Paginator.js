import {isNumber} from './NumberValidation';

export default class Paginator {
    constructor(queryLimit = 5, queryOffset = 0) {
        this.limit = isNumber(queryLimit) ? (parseInt(queryLimit) > 0 ? parseInt(queryLimit) : 5) : 5;
        this.offset = isNumber(queryOffset) ? (parseInt(queryOffset) >= 0 ? parseInt(queryOffset) : 5) : 5;
    }

    get_hasMore(total_count) {
        return this.limit * (this.offset + 1) < total_count;
    }
}
