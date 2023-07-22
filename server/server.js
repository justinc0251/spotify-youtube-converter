const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const session = require("express-session");
const { google } = require("googleapis");

dotenv.config();

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID; // Your Spotify client id
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET; // Your Spotify secret
const spotifyRedirectUri = "http://localhost:8888/spotify-callback"; // Your Spotify redirect uri

const youtubeClientId = process.env.YOUTUBE_CLIENT_ID; // Your YouTube client id
const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET; // Your YouTube secret
const youtubeRedirectUri = "http://localhost:8888/youtube-callback"; // Your YouTube redirect uri

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

// Serialization and Deserialization of user in Passport
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

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
  passport.authenticate("spotify", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to the client application with the access token
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

let auth = false;

app.get("/youtube-login", function (req, res) {
  if (!auth) {
    const authorizeUrl = youtubeOauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/youtube",
    });

    res.redirect(authorizeUrl);
  } else {
    const oauth2 = google.oauth2({
      auth: youtubeOauth2Client,
      version: "v2",
    });
    oauth2.userinfo.get(function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);
      }
    });
  }
});

app.get("/youtube-callback", function (req, res) {
  const code = req.query.code;
  if (code) {
    youtubeOauth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log(err);
      } else {
        console.log(tokens);
        youtubeOauth2Client.setCredentials(tokens);
        auth = true;
        res.redirect(
          "http://localhost:3000/#" +
            querystring.stringify({
              youtubeauth: auth,
              youtubeAccessToken: tokens.access_token, // Send the access token as a query parameter
            })
        );
      }
    });
  }
});

app.get("/youtube-playlist", function (req, res) {
  const youtube = google.youtube({
    auth: youtubeOauth2Client,
    version: "v3",
  });
  youtube.playlists.list(
    {
      part: "snippet",
      mine: true,
    },
    function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);
        res.send(response.data);
      }
    }
  );
});

app.get("/youtube-logout", function (req, res) {
  auth = false;
  res.redirect(
    "http://localhost:3000/#" +
      querystring.stringify({
        youtubeauth: auth,
      })
  );
});

console.log("Listening on 8888");
app.listen(8888);
