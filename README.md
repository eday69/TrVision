# TrVision
Twitter location map viewer

This is my first node.js app. Probably rusty in many points, but ... it works !

First thing is you need is a consumer & secret key from twitter app. Go to developer.twitter.com to get your own. 
Insert values in autorization.js file and run it from command line (node autorization.js). It should create oauth.json file on root directory.

public/mapshow.js has the client side code
index.js is the main core.

My office is behind a proxy server, so had to go around that. If you do not have a proxy server, you may comment out lines from where you find this comment:
  // Special section to work through proxy servers
  all the way to this other comment:
  // end of special section
  Its about 120 lines of code, from here: https://gist.github.com/matthias-christen/6beb3b4dda26bd6a221d
  Also, this part will be unnecesary:
  var agent = new httpsProxyAgent({
    proxyHost: '192.168.0.84',
    proxyPort: 3128
  });
  And last, but not least, remove the 'agent: agent' line from both trendOptions and tweetDetails.

Another point to do, is to create a DB. File trvisionMySql is a mysql script to create Db, tables and procedures used.
Now proxy or no proxy, it should work.

The system is basically doing two things, getting tweets (every 5 min) and uploading them to the database. And expecting user interaction from the frond end, where we will display information of those tweets.

