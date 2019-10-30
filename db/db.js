'use strict'
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true})

//name = osu username
const
    Osuuser = mongoose.model('Osuuser', {
        name: String,
        count: Number
    }),
    
    Donor = mongoose.model('Donor', {
        name: String,
        message: String,
        count: Number
    })

exports.Osuuser = Osuuser
exports.Donor = Donor