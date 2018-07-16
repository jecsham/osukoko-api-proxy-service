'use strict'
require('dotenv').config()
const app = require('./app.js'), server = app.listen(process.env.PORT || 3000, () => {
    console.log("Server ready")
})