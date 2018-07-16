'use strict'
const
    express = require('express'),
    favicon = require('serve-favicon'),
    app = express(),
    routes = require('./routes/index'),
    faviconURL = `${__dirname}/public/img/favicon.png`,
    publicDir = express.static(`${__dirname}/public`)

app
    .enable('trust proxy')
    .set('view engine', 'ejs')
    .use(favicon(faviconURL))
    .use(publicDir)
    .use('/', routes)

const http = require("http");
setInterval(() => {
    http.get("http://osu-koko.herokuapp.com");
}, 900000)

module.exports = app