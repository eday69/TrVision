var http = require('http');  // is this not contained in previous line?
var express = require("express");
var port = 3700;
const path = require('path');

/// Special section to work through proxy servers
var Util = require('util');
var https = require('https');
var Tls = require('tls');

function  httpsProxyAgent(options) {
    https.Agent.call(this, options);

    this.proxyHost = options.proxyHost;
    this.proxyPort = options.proxyPort;

    this.createConnection = function (opts, callback) {
        // do a CONNECT request
        var req = http.request({
        host: options.proxyHost,
        port: options.proxyPort,
        method: 'CONNECT',
        path: opts.host + ':' + opts.port,
        headers: {
            host: opts.host
        }
    });

    req.on('connect', function (res, socket, head) {
    var cts = Tls.connect({
        host: opts.host,
        socket: socket
    }, function () {
        callback(false, cts);
    });
    });

    req.on('error', function (err) {
        callback(err, null);
    });

    req.end();
    }
}

Util.inherits(httpsProxyAgent, https.Agent);

// Almost verbatim copy of http.Agent.addRequest
httpsProxyAgent.prototype.addRequest = function (req, options) {
var name = options.host + ':' + options.port;
if (options.path) name += ':' + options.path;

if (!this.sockets[name]) this.sockets[name] = [];

if (this.sockets[name].length < this.maxSockets) {
    // if we are under maxSockets create a new one.
    this.createSocket(name, options.host, options.port, options.path, req, function (socket) {
        req.onSocket(socket);
    });
} else {
    // we are over limit so we'll add it to the queue.
    if (!this.requests[name])
    this.requests[name] = [];
    this.requests[name].push(req);
}
};

// Almost verbatim copy of http.Agent.createSocket
httpsProxyAgent.prototype.createSocket = function (name, host, port, localAddress, req, callback) {
    var self = this;
    var options = Util._extend({}, self.options);
    options.port = port;
    options.host = host;
    options.localAddress = localAddress;

    options.servername = host;
    if (req) {
        var hostHeader = req.getHeader('host');
        if (hostHeader)
            options.servername = hostHeader.replace(/:.*$/, '');
    }

    self.createConnection(options, function (err, s) {
    if (err) {
        err.message += ' while connecting to HTTP(S) proxy server ' + self.proxyHost + ':' + self.proxyPort;

        if (req)
            req.emit('error', err);
        else
            throw err;

    return;
}

if (!self.sockets[name]) self.sockets[name] = [];

self.sockets[name].push(s);

var onFree = function () {
    self.emit('free', s, host, port, localAddress);
};

var onClose = function (err) {
    // this is the only place where sockets get removed from the Agent.
    // if you want to remove a socket from the pool, just close it.
    // all socket errors end in a close event anyway.
    self.removeSocket(s, name, host, port, localAddress);
};

var onRemove = function () {
    // we need this function for cases like HTTP 'upgrade'
    // (defined by WebSockets) where we need to remove a socket from the pool
    // because it'll be locked up indefinitely
    self.removeSocket(s, name, host, port, localAddress);
    s.removeListener('close', onClose);
    s.removeListener('free', onFree);
    s.removeListener('agentRemove', onRemove);
};

s.on('free', onFree);
s.on('close', onClose);
s.on('agentRemove', onRemove);

callback(s);
});
};
// end of special section

// var https = require('https');
var agent = new httpsProxyAgent({
    proxyHost: '192.168.0.84',
    proxyPort: 3128
});

var headers = {
	'User-Agent': 'Coding Defined',
	Authorization: 'Bearer ' + require('./oauth.json').access_token
};

// mysql credentials, use your own credentials here.
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'trvision',
  charset  : 'utf8mb4',
  multipleStatements: true
});

// open connection to mysql
connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... nn");
} else {
    console.log("Error connecting database ... nn");
}
});

// query to get places for a particular trend id
function getplacefortrend(con, trendid, cb)
{
    var json = '';
    con.query('select distinct place, count(*) as times from tweets where place is not null and trend_id = '+trendid+' group by place;',
           function(err, results, fields) {
       if (err)
           return cb(err, null);
       json = JSON.stringify(results);

//       console.log('JSON-result:', json);
       cb(null, json);
  });
}

// query to get all trends
function getalltrends(con, cb)
{
    var json = '';
    var qry="select idtrends, name, datediff(current_timestamp, created_at) as days "+
             "from trends "+
             "order by 3, 2;";
    con.query(qry, function(err, results, fields) {
       if (err)
           return cb(err, null);
       json = JSON.stringify(results);
//       console.log('JSON-result:', json);
       cb(null, json);
  });
}

//query to insert a trend, it will return a trendid. If already exists, will return trend id on table.
function instrend(con, newtrend, cb)
{
//  var usuario = { name: newuser };
  var sql_stmt = 	'SET @trendid = 0; CALL trend_ins(?, ?, ?, @trendid); SELECT @trendid as trendid;'
//	"INSERT INTO trends SET name=?, query=?, tweet_volume=? ";
  sql_stmt = mysql.format(sql_stmt, newtrend);
//	console.log('stmt: '+JSON.stringify(newtrend, null, 2));

  con.query(sql_stmt, function(err, res){
    if(err)
		{
    	console.log('User already in DB');
			console.log('err: '+JSON.stringify(err, null, 2));
			cb(err, null);
		}
    else
		{
//  		console.log('Last insert ID:', res[2][0].trendid);
		  cb(null, res[2][0].trendid);
		}
  });
}

// query to insert a new tweet, for a particular trend id
function instweet(con, newtweet, cb)
{
//  var usuario = { name: newuser };
  var sql_stmt = 	'CALL tweet_ins(?, ?, ?, ?, ?, ?, ?, ?);'
//	"INSERT INTO trends SET name=?, query=?, tweet_volume=? ";
  sql_stmt = mysql.format(sql_stmt, newtweet);
  con.query(sql_stmt, function(err, res){
    if(err)
		{
			console.log('err: '+JSON.stringify(err, null, 2));
			cb(err);
		}
    else
		{
		  cb(null);
		}
  });
}

// call twitter api
function callTwitter(options, callback){
	https.get(options, function(response) {
		jsonHandler(response, callback);
	}).on('error', function(e) {
		console.log('Error : ' + e.message);
	})
}

// twitter trend options (dont use agent if not behing proxy)
var trendOptions = {
	host: 'api.twitter.com',
	path: '/1.1/trends/place.json?id=1', // id = 1 for global trends
	headers: headers ,
	agent: agent
}

// twitter details options (dont use agent if not behing proxy)
var tweetDetails = {
	maxResults: 250,
	max_id: null,
	since_id:0,
	resultType: 'recent', // options are mixed, popular and recent
	options: {
		host: 'api.twitter.com',
		headers: headers,
    agent: agent
	}
}

function jsonHandler(response, callback) {
	var json = '';
	response.setEncoding('utf8');
	if(response.statusCode === 200) {
		response.on('data', function(chunk) {
			json += chunk;
		}).on('end', function() {
			callback(JSON.parse(json));
		});
	} else {
		console.log('Error : ' + response.statusCode);
	}
}

function fullTweetPath(query) {
	var path = '/1.1/search/tweets.json?q=' + query;
	if (tweetDetails.max_id)
  	path += '&max_id=' + tweetDetails.max_id;
//	if (tweetDetails.since_id)
//  	path += '&since_id=' + tweetDetails.since_id;
	path += '&count=' + tweetDetails.maxResults
	+ '&include_entities=true&result_type=' + tweetDetails.resultType;

	tweetDetails.options.path = path;
}

// convert twitter id (very large number) to str
function decStrNum (n) {
    n = n.toString();
    var result=n;
    var i=n.length-1;
    while (i>-1) {
      if (n[i]==="0") {
        result=result.substring(0,i)+"9"+result.substring(i+1);
        i --;
      }
      else {
        result=result.substring(0,i)+(parseInt(n[i],10)-1).toString()+result.substring(i+1);
        return result;
      }
    }
    return result;
}

// getMoreTweets will get the tweets of a particular trendid by blocks of maxResults (tweetDetails options)
// it will insert the tweet in the DB and continue until last tweet from trend is downloaded
var getMoreTweets = function(query, trendid){
	var myplace=null;
	fullTweetPath(query);
	callTwitter(tweetDetails.options, function(tweetObj) {
//			console.log(JSON.stringify(tweetObj.search_metadata, null, 2));
      if (tweetObj.statuses.length > 0)
			{
			  new_path=tweetObj.search_metadata.next_results;
				tweetObj.statuses.forEach(function(tweet) {
					if (tweet)
					++contador;
					if (tweet.place)
					  myplace=tweet.place.full_name;
/*
						"coordinates":tweet.coordinates,
						"geo":tweet.geo,
						"geo_enabled":tweet.geo_enabled,
*/
					newtweet=[tweet.id_str, tweet.created_at,
										tweet.text, myplace, tweet.lang,
										trendid,
										tweet.user.screen_name, tweet.user.id_str];
//					console.log(JSON.stringify(newtweet, null, 2));
				instweet(connection, newtweet, function(err){
						if (err)
							console.log('Error inserting tweet');
					});

				});
				var lastTweet = decStrNum(tweetObj.statuses[tweetObj.statuses.length - 1].id_str);
				tweetDetails.max_id = lastTweet;
				tweetDetails.since_id = tweetObj.statuses[0].id_str;
				fullTweetPath(query);
				if (contador < 300)
				{
					getMoreTweets(lastTweet);
				}
			}
		});
	}


var calls = 0;
var contador=0;

var newtrend={};
var newtweet={};

// main starting point of program
// setInterval is set to cycle every 5 min (300,000 milliseconds)
// it will read the trends, and for every trend, call getMoreTweets to get the tweets themselves.
setInterval(function(){
  // here we call the twitter
  console.log('Getting more tweets...');
	callTwitter(trendOptions, function(trendsArray){
	  ++calls;
	  trendsArray.forEach(function(trends){
		  var srchtrend=trends.trends;

		  srchtrend.forEach(function(trend){
				newtrend = [trend.name, trend.query, trend.tweet_volume];
				instrend(connection, newtrend, function(err, trendid){
					// when we insert the trend in the db, we return an id for it. If it already exists, we return its previously created id.
					contador=0;
//					console.log('New trend id : '+ trendid);
					getMoreTweets(trend.query, trendid);
				});
			});
		});
	});

},300000);  // we wait five minutes before calling again


var app = express();
// Set views path
app.set('views', path.join(__dirname, 'views'));
// Set public path
app.use(express.static(path.join(__dirname, 'public')));
// Set pug as view engine
app.set('view engine', 'pug');

// inicial render of page by express
app.get("/",function (req,res)
    {
       // now we use the templating capabilities of express and call our template to render the view, and pass a few parameters to it
        res.render( "maprender", { layout: false, lat:0, lon:0, zoom:2, geohash:req.params["id"]});
    });

    // open sockets
    var io = require('socket.io').listen(app.listen(port));
    io.sockets.on('connection', function (socket) {
       var trendid;
       var trends;

       // for a certian trend id, get places (address)
       socket.on('place', function (trendid) {
         console.log('Searching for trendid: '+trendid);
         getplacefortrend(connection, trendid, function(err, address) {
               if (err) return console.error(err);
               socket.emit('place', address);
         });
       });

       // load all trends in DB
       getalltrends(connection, function(err, trends){
         if (err) return console.error(err);
         socket.emit('alltrends', trends);
       });

    });
