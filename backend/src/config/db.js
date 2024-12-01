const { Pool } = require('pg')
require('dotenv').config()

const password = process.env.DB_PASS

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: password,
    port: process.env.DB_PORT || 5432,
})

module.exports = pool