'use strict'
const
    express = require('express'),
    router = express.Router(),
    request = require('request'),
    RateLimit = require('express-rate-limit'),
    Osuuser = require('../models/models').Osuuser,
    Donor = require('../models/models').Donor,
    limiter = new RateLimit({
        windowMs: 1500,
        max: 1,
        delayMs: 0,
        message: "{}"
    })

function test(req, res) {
    let locals = {
        title: 'Test',
        description: 'Site running in node!',
    }
    res.render('index', locals)
}

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

            urls[i] = `https://osu.ppy.sh/api/get_user?k=${process.env.API_KEY}&u=${encodeURIComponent(req.query.u)}&type=string&m=${i}`;
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

function error404(req, res, next) {
    let error = new Error(),
        locals = {
            title: 'Error 404',
            description: 'Page not found'
            //error : error
        }
    error.status = 404
    res.render('error', locals)
    next()
}

function thanks(req, res) {
    let locals = {
        title: 'Thank you!',
        message: 'Thank you for support me!'
    }
    res.render('index', locals)
}

function donate(req, res) {

    // Add your credentials:
    // Add your client ID and secret
    const
        CLIENT = process.env.PAYPAL_CLIENT,
        SECRET = process.env.PAYPAL_SECRET,
        PAYPAL_API = 'https://api.sandbox.paypal.com'

    express()
        // Set up the payment:
        // 1. Set up a URL to handle requests from the PayPal button
        .post('/my-api/create-payment/', function (req, res) {
            // 2. Call /v1/payments/payment to set up the payment
            request.post(PAYPAL_API + '/v1/payments/payment', {
                auth: {
                    user: CLIENT,
                    pass: SECRET
                },
                body: {
                    intent: 'sale',
                    payer: {
                        payment_method: 'paypal'
                    },
                    transactions: [{
                        amount: {
                            total: '5.99',
                            currency: 'USD'
                        }
                    }],
                    redirect_urls: {
                        return_url: 'https://www.mysite.com',
                        cancel_url: 'https://www.mysite.com'
                    }
                },
                json: true
            }, function (err, response) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(500);
                }

                // 3. Return the payment ID to the client

                res.json({
                    id: response.body.id
                });
            });
        })
        // Execute the payment:
        // 1. Set up a URL to handle requests from the PayPal button.
        .post('/my-api/execute-payment/', function (req, res) {
            // 2. Get the payment ID and the payer ID from the request body.
            var paymentID = req.body.paymentID;
            var payerID = req.body.payerID;
            var amount = req.body.amount;
            var osuname = req.body.osuname;
            var msg = req.body.msg;

            // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
            request.post(PAYPAL_API + '/v1/payments/payment/' + paymentID + '/execute', {
                auth: {
                    user: CLIENT,
                    pass: SECRET
                },
                body: {
                    payer_id: payerID,
                    transactions: [{
                        amount: {
                            total: amount,
                            currency: 'USD'
                        }
                    }]
                },
                json: true
            }, function (err, response) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(500);
                }

                // 4. Return a success response to the client
                var query = {
                    'name': osuname,
                    'message': msg
                }
                Donor.findOneAndUpdate(query,
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
                res.json({
                    status: 'success'
                });
            });
        });


    let locals = {
        title: 'Donate'
    }
    res.render('donate', locals)
}

function home(req, res, next) {
    let locals = {
        title: 'Welcome'
    }
    res.render('home', locals)
}

router
    .use('/osuapi', limiter)
    .get('/osuapi', osuapi)
    .get('/', home)
    .get('/test', test)
    .get('/donate', donate)
    .get('/donate/thanks', thanks)
    .use(error404)

module.exports = router