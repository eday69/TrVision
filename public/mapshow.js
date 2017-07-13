
var geocoder;
var map;
var markers = [];
var socket;

window.onload = function() {

//        socket = io.connect('http://ec2-54-245-47-49.us-west-2.compute.amazonaws.com:3700/');
        socket = io.connect('localhost:3700/');
        geocoder = new google.maps.Geocoder();
        var gdl = new google.maps.LatLng(20.6674862, -103.3991778);
        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 2,
          center: gdl
        });

        // This event listener calls addMarker() when the map is clicked.
/*
        google.maps.event.addListener(map, 'click', function(event) {
          addMarker(event.latLng, map);
        });
*/
        deleteMarkers();

        socket.on('place', function(places) {
          var lugares = JSON.parse(places);
          if(lugares.length) {
            lugares.forEach(function(place){
  //            console.log(place.place);
              codeAddress(place.place, place.times);
            });
          }
          else {
            alert('No places in tweets !!');
          }
        });

        socket.on('gettweets', function(tweetinfo) {
          var divtweet = document.getElementById("overlay");
          var thetweetinfo = JSON.parse(tweetinfo);
          if(thetweetinfo.length) {
            var html = '';
            var trid;
            var twcount=0;
            thetweetinfo.forEach(function(twinfo){
              ++twcount;
              trid = twinfo.trend_id;
              html += "<div id='twtable' onclick='closetweettable();'>";
              html += "<div class='row'>";
              html += "<div class='celltext'>"+twcount+") Tw: "+twinfo.text;
              html += "</div><div class='cellplace'>"+twinfo.place;
              html += "</div><div class='celldate'>"+twinfo.twdate+"</div>";
              html += "</div>";
              html += "</div>";
            });
            console.log('trid: '+trid);
            var thetr = document.getElementById(trid);
            var thetrTextRectangle = thetr.getBoundingClientRect();

            console.log("logo's left pos.:", thetrTextRectangle.left);
            console.log("logo's top pos.:", thetrTextRectangle.top);
            divtweet.style.top=thetrTextRectangle.top+16;
            divtweet.innerHTML = html;
          }
          else {
            divtweet.innerHTML='No tweets (with place) for this trendid !!';
          }
          divtweet.style.display = "block";
        });


        var trendlist = document.getElementById("trendlist");
        socket.on('alltrends', function(trends) {
          var trends = JSON.parse(trends);
          trends.forEach(function(trend){
            var html = '';
//            console.log(place.place);
            html = "<div>";
            html += "<div class='trendday'>("+trend.thours+" hours)  ["+trend.tdays+" days age]</div>";
            html += "<a id='"+trend.idtrends +"' href='#' onClick='mapidtrend("+trend.idtrends +");' class='trendsinfo'>" + trend.name + "</a>";
            html += "</div>"
            trendlist.insertAdjacentHTML('beforeend', html);
          });
        });

}

function closetweettable() {
  var divtweet = document.getElementById("overlay");
  divtweet.innerHTML = "";
  divtweet.style.display = "none";
};

function mapidtrend(idtrends) {
  var tridtw = event.srcElement;
   deleteMarkers();
   console.log('Cleaned all markers');
   socket.emit('place', idtrends);
   socket.emit('gettweets', idtrends);
   console.log('got em suckers');
};

// Sets the map on all markers in the array.
 function setMapOnAll(map) {
   for (var i = 0; i < markers.length; i++) {
     markers[i].setMap(map);
   }
 }

 // Removes the markers from the map, but keeps them in the array.
  function clearMarkers() {
    setMapOnAll(null);
  }

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

function codeAddress(newaddress, times) {
//        alert('address :'+newaddress);
//         var address = '1600 Amphitheatre Parkway, Mountain View, CA';
 geocoder.geocode( { address: newaddress}, function(results, status) {
   if (status == 'OK') {
     map.setCenter(results[0].geometry.location);
     var marker = new google.maps.Marker({
         label: times.toString(),
         title: times.toString()+' tweets! ('+newaddress+')',
         map: map,
         position: results[0].geometry.location
     });
     markers.push(marker);
   } else {
     // do nothing
//     alert('Geocode was not successful for the following reason: ' + status);
   }
 });
}

//       google.maps.event.addDomListener(window, 'load', initialize);
