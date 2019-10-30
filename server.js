'use strict'

require('dotenv').config()

const
    express = require('express'),
    app = express(),
    routes = require('./routes/index'),
    cors = require('cors')


app
    .use(cors())
    .use('/', routes)
    .listen(process.env.PORT || 3000, () => {
        console.log("Server ready")
    })