import React, { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import "./login.css";

const Login = () => {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const getTokenFromUrl = () => {
    return window.location.hash
      .substring(1)
      .split("&")
      .reduce((initial, item) => {
        let parts = item.split("=");
        initial[parts[0]] = decodeURIComponent(parts[1]);
        return initial;
      }, {});
  };

  useEffect(() => {
    const spotifyToken = getTokenFromUrl().access_token;
    window.location.hash = "";
    console.log(spotifyToken);
    if (spotifyToken) {
      setSpotifyToken(spotifyToken);
      setLoggedIn(true);
    }
  }, []);

  const getPlaylists = async () => {
    const spotify = new SpotifyWebApi();
    spotify.setAccessToken(spotifyToken);
    const playlists = await spotify.getUserPlaylists();
    setPlaylists(playlists.items);
  };

  return (
    <div className="login-container">
      <div className="spotify-login">
        {loggedIn ? (
          "Logged in to Spotify!"
        ) : (
          <a href="http://localhost:8888/login">Login to Spotify</a>
        )}
      </div>
      <div className="youtube-login">
        <a href="http://localhost:8888/login">Login to Youtube</a>
      </div>
      {loggedIn ? (
        <div className="playlists">
          <button onClick={getPlaylists}>Get Playlists</button>
          {playlists.map((playlist) => (
            <div className="playlist-container">
              <img key={playlist.id} src={playlist.images[0].url} />
              <p key={playlist.id}>{playlist.name}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Login;
