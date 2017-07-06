# TrVision
Twitter location map viewer

This is my first node.js app. Probably rusty in many points, but ... it works !
I've used node.js (of course), express as frame work, pug as template engine, socket.io (bi-directional comunicator event-based), and mysql as db. On the client side we are using the google api for map & markers rendering.

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

You run the application as localhost:2700 (locally, or change it to server used, but leave port 3700 !). Since the app listens on port 3700 to requests.

Once web page is loaded, you get two columns, one for the trends and the large one for the map.
All needed to be done is select one of the trends, and markers will appear on the map of the location of the tweets. The number on each marker is the amount of tweets for that localtion.
It is important to note that not all tweets have a location, so not all tweets for a trends are shown. It is even possible to have a trend with no markers since none of its tweets had a location.


