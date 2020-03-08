import {Pool} from 'pg';
const config = {
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE,
    host: process.env.DBHOST,
    port: process.env.DBPORT,
}
const pool = new Pool(config);

const client = async () => await pool.connect();
const query = (text, params) => pool.query(text, params);

const db = {
    client:client,
    query:query
}

export default db;
