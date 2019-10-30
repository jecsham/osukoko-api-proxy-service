'use strict'
const
    express = require('express'),
    router = express.Router(),
    request = require('request'),
    RateLimit = require('express-rate-limit'),
    Osuuser = require('../db/db').Osuuser,
    limiter = new RateLimit({
        windowMs: 1500,
        max: 1,
        delayMs: 0,
        message: "{}"
    })

function osuapi(req, res) {
    // __request algorithm create by natos (https://github.com/natos/)
    var __request = (urls, callback) => {
        var results = {}, t = urls.length, c = 0,
            handler = (error, response, body) => {
                var url = response.request.uri.href;
                results[url] = {
                    error: error,
                    response: response,
                    body: body
                }
                if (++c === urls.length) {
                    callback(results)
                }
            }
        while (t--) {
            request(urls[t], handler)
        }
    }
    //end __request

    if (typeof req.query.u !== 'undefined') {
        var getdata = []
        var printdata = {}
        var urls = []
        for (let i = 0; i < 4; i++) {
            urls[i] = `https://osu.ppy.sh/api/get_user?k=${process.env.OSU_API_KEY}&u=${encodeURIComponent(req.query.u)}&type=string&m=${i}`;
            //console.log(`Req val: ${req.query.u}, Api url id ${i}`)
        }
        __request(urls, (responses) => {
            res.setHeader('Content-Type', 'application/json')
            for (let i in urls) {
                if ((responses[urls[i]].body == "[]") || (responses[urls[i]].body.charAt(0) == "<")) {
                    break
                }
                getdata[i] = JSON.parse(responses[urls[i]].body)
                printdata["pp" + i] = getdata[i][0].pp_raw
                printdata["pprank" + i] = getdata[i][0].pp_rank
                printdata["ppcrank" + i] = getdata[i][0].pp_country_rank
            }
            //console.log("Requests completed")
            //console.log(printdata)
            res.send(JSON.stringify(printdata))
            var query = {
                'name': req.query.u
            }
            Osuuser.findOneAndUpdate(query,
                {
                    $inc: {
                        count: 1
                    }
                },
                {
                    upsert: true
                }, (err, doc) => {
                    if (err) return console.log('Error: ' + err)
                    return console.log("Succesfully saved")
                })

        })
    } else {
        //console.log("is undefined")
        res.send("{}")
    }
}

function home(req, res, next) {
    res.send('Osu!koko API Proxy Service :p - UP')
}

router
    .use('/osuapi', limiter)
    .get('/osuapi', osuapi)
    .get('/', home)

module.exports = router