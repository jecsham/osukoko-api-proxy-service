'use strict'
const
    express = require('express'),
    app = express(),
    routes = require('./routes/index'),
    cors = require('cors')

app
    .use(cors())
    .use('/', routes)

module.exports = app