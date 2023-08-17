const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const YouTubeV3Strategy = require("passport-youtube-v3").Strategy;
const session = require("express-session");
const { google } = require("googleapis");
const SpotifyWebApi = require("spotify-web-api-node");

dotenv.config();

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID; // Your Spotify client id
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET; // Your Spotify secret
const spotifyRedirectUri = process.env.SPOTIFY_REDIRECT_URI; // Your Spotify redirect uri

const youtubeClientId = process.env.YOUTUBE_CLIENT_ID; // Your YouTube client id
const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET; // Your YouTube secret
const youtubeRedirectUri = process.env.YOUTUBE_REDIRECT_URI; // Your YouTube redirect uri

const app = express();

app.use(
  session({
    secret: "secret-key", // Replace with a secret key for session encryption (you can use any string here)
    resave: false,
    saveUninitialized: false,
  })
);

// Use middleware
app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Serialization and Deserialization of user in Passport
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Spotify Strategy for Passport
passport.use(
  new SpotifyStrategy(
    {
      clientID: spotifyClientId,
      clientSecret: spotifyClientSecret,
      callbackURL: spotifyRedirectUri,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      // Store the Spotify access token in the user's session or database
      // In this example, we store it in a cookie
      const user = { accessToken };
      return done(null, user);
    }
  )
);

passport.use(
  new YouTubeV3Strategy(
    {
      clientID: youtubeClientId,
      clientSecret: youtubeClientSecret,
      callbackURL: youtubeRedirectUri,
      scope: ["https://www.googleapis.com/auth/youtube"],
      authorizationParams: {
        access_type: "offline",
      },
    },
    function (accessToken, refreshToken, profile, done) {
      // Store the YouTube access token in the user's session or database
      // In this example, we store it in a cookie
      const user = { accessToken };
      return done(null, user);
    }
  )
);

// Spotify login route
app.get(
  "/spotify-login",
  passport.authenticate("spotify", {
    scope: ["user-read-private", "playlist-read-private", "user-library-read"],
  })
);

// Spotify callback route
app.get(
  "/spotify-callback",
  passport.authenticate("spotify", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, set the user object and redirect to the client application with the access token
    req.user = { accessToken: req.user.accessToken };
    res.redirect("http://localhost:3000/#" + querystring.stringify(req.user));
  }
);

app.get("/spotify-logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect(
      "http://localhost:3000/#" +
        querystring.stringify({
          spotifyauth: false,
        })
    );
  });
});

const youtubeOauth2Client = new google.auth.OAuth2(
  youtubeClientId,
  youtubeClientSecret,
  youtubeRedirectUri
);

app.get("/youtube-login", passport.authenticate("youtube"));

app.get(
  "/youtube-callback",
  passport.authenticate("youtube", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, set the user object and redirect to the client application with the access tokens
    req.user = {
      youtubeAccessToken: req.user.accessToken, // Rename accessToken to youtubeAccessToken to differentiate from Spotify token
      spotifyAccessToken: req.session.passport.user.accessToken, // Get the Spotify access token from the session
    };
    res.redirect("http://localhost:3000/#" + querystring.stringify(req.user));
  }
);

app.get("/youtube-logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect(
      "http://localhost:3000/#" +
        querystring.stringify({
          youtubeauth: false,
        })
    );
  });
});

app.get("/convert-to-youtube", async function (req, res) {
  const youtubeAccessToken = req.headers.youtubeauthorization.replace(
    "Bearer ",
    ""
  );
  const spotifyAccessToken = req.headers.spotifyauthorization.replace(
    "Bearer ",
    ""
  );

  if (!youtubeAccessToken) {
    res
      .status(401)
      .json({ error: "Unauthorized - YouTube access token not provided" });
    return;
  }

  const spotify = new SpotifyWebApi();
  spotify.setAccessToken(spotifyAccessToken);

  // Get the selected Spotify playlist from the request query parameter
  const spotifyPlaylistId = req.query.spotifyPlaylistId;

  // Get the details of the selected Spotify playlist
  try {
    const response = await spotify.getPlaylist(spotifyPlaylistId);
    const playlistName = response.body.name;
    const youtube = google.youtube({
      auth: youtubeOauth2Client,
      version: "v3",
    });

    youtubeOauth2Client.setCredentials({ access_token: youtubeAccessToken });

    // Create the YouTube playlist with the same name as the Spotify playlist
    try {
      const playlistResponse = await youtube.playlists.insert({
        part: "snippet",
        resource: {
          snippet: {
            title: playlistName,
          },
        },
      });

      const youtubePlaylistId = playlistResponse.data.id;
      console.log("YouTube playlist ID:", youtubePlaylistId);
      for (const track of response.body.tracks.items) {
        try {
          const youtubeSearchResponse = await youtube.search.list({
            part: "snippet",
            q: `${track.track.name} ${track.track.artists[0].name}`,
            maxResults: 1,
          });

          if (youtubeSearchResponse.data.items.length === 0) {
            console.log(
              `No YouTube video found for ${track.track.name} by ${track.track.artists[0].name}`
            );
            continue;
          }

          const youtubeVideoId = youtubeSearchResponse.data.items[0].id.videoId;
          await youtube.playlistItems.insert({
            part: "snippet",
            resource: {
              snippet: {
                playlistId: youtubePlaylistId,
                resourceId: {
                  kind: "youtube#video",
                  videoId: youtubeVideoId,
                },
              },
            },
          });
          console.log(
            `Added ${track.track.name} by ${track.track.artists[0].name} to YouTube playlist`
          );
        } catch (err) {
          console.error(
            `Error adding ${track.track.name} by ${track.track.artists[0].name} to YouTube playlist:`,
            err
          );
        }
      }
      console.log("YouTube playlist created successfully");
      res.status(200).json({
        message: "YouTube playlist created successfully",
        youtubePlaylistLink: `https://www.youtube.com/playlist?list=${youtubePlaylistId}`,
      });
    } catch (err) {
      console.error("Error creating YouTube playlist:", err);
      res.status(500).json({ error: "Error creating YouTube playlist" });
    }
  } catch (err) {
    console.error("Error getting Spotify playlist details:", err);
    res.status(500).json({ error: "Error getting Spotify playlist details" });
  }
});

console.log("Listening on 8888");
app.listen(8888);
