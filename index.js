const express = require('express')
const app = express()
const port = 3000

var dayjs = require('dayjs')
var querystring = require("querystring")
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`)

})
var SpotifyWebApi = require('spotify-web-api-node');

var cet = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(cet)
dayjs.extend(timezone)
dayjs.tz.setDefault("Europe/Berlin")


app.get('/login', function(req, res) {

  var state = "jrvskrkprjauekrh";
  res.cookie('stateKey', state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public user-library-read'; //'playlist-read-public playlist-modify-public';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.client_id,
      scope: scope,
      redirect_uri: process.env.uri,
    }));
});
app.get('/callback', function(req, res) {
  res.send(JSON.stringify(req.body) + JSON.stringify(req.params))
  console.log(req.params)
})

  console.log(dayjs().format("dddd, D [of] MMMM YY, HH:mm:ss  "))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
function compare(falsecb, truecb){
    spotifyApi.getMySavedTracks({
    limit: 50,
    offset: 0
  })
    .then(function(data) {
      spotifyApi.getPlaylist(process.env.playlist)
        .then(function(data2) {
          let saved= data.body.items.map(function(t) {
        return t.track.uri
          })
          
          let stored= data2.body.tracks.items.map(function(t) {
        return t.track.uri
          })
          //console.log(saved,stored)
          if(JSON.stringify(stored)==JSON.stringify(saved)){

            truecb()
          }
          else{
            falsecb()
          }

      })
    })
}
function write() {
  spotifyApi.getMySavedTracks({
    limit: 50,
    offset: 0
  })
    .then(function(data) {
      console.log('Done!');
      let tracks = data.body.items;


      tracks = tracks.map(function(t) {
        return t.track.uri

      })
      //console.log(tracks)
      spotifyApi.addTracksToPlaylist(process.env.playlist, tracks)
        .then(function(data) {
          console.log('Added tracks to playlist!');
          spotifyApi.changePlaylistDetails(process.env.playlist,
            {
              description: `An automatically updated playlist with the last 50 tracks of my liked songs...  (Last Update: ${dayjs().format("dddd, D [of] MMMM YY, HH:mm:ss  ")} UTC)`
            }).then(function(data) {
              //console.log(data);
            }, function(err) {
              console.log('Something went wrong!', err);
            });
        }, function(err) {
          console.log('Something went wrong!', err);
        });
    }, function(err) {
      console.log('Something went wrong!', err);
    });
}
// credentials are optional
var scopes = ['user-read-private', 'user-read-email', 'playlist-modify-public', 'user-library-read']
var spotifyApi = new SpotifyWebApi({
  clientSecret: process.env.client_pwd,
  clientId: process.env.client_id,
  redirectUri: process.env.uri
});

spotifyApi.setRefreshToken(process.env['refresh_token']);
// Get Elvis' albums
setInterval(function() {
  spotifyApi.refreshAccessToken().then(
    function(data) {
      console.log('The access token has been refreshed!');

      // Save the access token so that it's used in future calls


      spotifyApi.setAccessToken(data.body['access_token']);

compare(function(){
      console.log("Interval started")
      spotifyApi.getPlaylist(process.env.playlist)
        .then(function(data) {
          let tracks = data.body.tracks.items
          //console.log(tracks)
          if (tracks.length) {
            tracks = tracks.map(function(t) {
              return {
                uri: t.track.uri
              }
            })
            var playlistId = process.env.playlist;
            var options = {};
            spotifyApi.removeTracksFromPlaylist(playlistId, tracks, options)
              .then(function(data) { //cleared playlist
                console.log('Tracks removed from playlist!');
                write()
              }, function(err) {
                console.log('Something went wrong!', err);
              });
            //console.log(tracks)

          } else if (tracks.length > 99) {
            console.log("Tracks were too long")
          } else {
            write()
          }
        }, function(err) {
          console.log('Something went wrong!', err);
        });},function(){//Tracks in liked and playlist are the same
          console.log("Match already")
          spotifyApi.changePlaylistDetails(process.env.playlist,
            {
              description: `An automatically updated playlist with the last 50 tracks of my liked songs...  (Last Update: ${dayjs().format("dddd, D [of] MMMM YY, HH:mm:ss  ")} UTC)`
            }).then(function(data) {
              //console.log(data);
            }, function(err) {
              console.log('Something went wrong!', err);
            });
        })
    },
    function(err) {
      console.log('Could not refresh access token', err);
    }
  );
}, 1000 * 60*5)