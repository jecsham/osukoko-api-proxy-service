var express = require('express');
var app = express();
var request = require('request');
var RateLimit = require('express-rate-limit');

// __request algorithm create by natos (https://github.com/natos/)
var __request = (urls, callback) => {
  'use strict';
  var results = {}, t = urls.length, c = 0,
    handler = (error, response, body) => {
      var url = response.request.uri.href;
      results[url] = { error: error, response: response, body: body };
      if (++c === urls.length) { callback(results); }
    };
  while (t--) { request(urls[t], handler); }
};
//end __request

app.enable('trust proxy');
var limiter = new RateLimit({
  windowMs: 1500,
  max: 1,
  delayMs: 0,
  message: "{}"
});
app.use(limiter);

app.get('/osuapi', (req, res) => {
  if (typeof req.query.u !== 'undefined') {
    var getdata = [];
    var printdata = {};
    var urls = [];
    for (i = 0; i < 4; i++) {
      
      urls[i] = `https://osu.ppy.sh/api/get_user?k=${process.env.API_KEY}&u=${encodeURIComponent(req.query.u)}&type=string&m=${i}`;
      //console.log(`Req var: ${req.query.u}, Api url id ${i}`);
    }
    __request(urls, (responses) => {
      res.setHeader('Content-Type', 'application/json');
      for (i in urls) {
        if ((responses[urls[i]].body == "[]") || (responses[urls[i]].body.charAt(0) == "<")) {
          break;
        }
        getdata[i] = JSON.parse(responses[urls[i]].body);
        printdata["pp" + i] = getdata[i][0].pp_raw;
        printdata["pprank" + i] = getdata[i][0].pp_rank;
        printdata["ppcrank" + i] = getdata[i][0].pp_country_rank;
      }
      //console.log("Requests completed");
      //console.log(printdata);
      res.send(JSON.stringify(printdata));
    });
  } else {
    //console.log("is undefined");
    res.send("{}");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server ready");
});