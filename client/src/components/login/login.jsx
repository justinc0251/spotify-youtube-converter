import React, { useEffect, useState, useCallback } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import "./login.css";

const Login = () => {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [userPicture, setUserPicture] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [spotifyLoggedIn, setSpotifyLoggedIn] = useState(false);
  const [youtubeToken, setYoutubeToken] = useState("");
  const [youtubeLoggedIn, setYoutubeLoggedIn] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);

  const getSpotifyTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    return urlParams.get("accessToken");
  };

  const getYouTubeTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.hash);
    return urlParams.get("youtubeAccessToken");
  };

  const getUserProfile = useCallback(async () => {
    const spotify = new SpotifyWebApi();
    spotify.setAccessToken(spotifyToken);
    const user = await spotify.getMe();
    console.log(user);

    if (user.images && user.images.length > 0) {
      setUserPicture(user.images[0].url); // Set the user's profile picture
    }
    setDisplayName(user.display_name); // Set the user's display name
  }, [spotifyToken]);

  useEffect(() => {
    const spotifyToken = getSpotifyTokenFromUrl();
    const youtubeAccessToken = getYouTubeTokenFromUrl();

    window.location.hash = "";
    if (spotifyToken) {
      setSpotifyToken(spotifyToken);
      setSpotifyLoggedIn(true);
    }
    if (youtubeAccessToken) {
      setYoutubeToken(youtubeAccessToken);
      setYoutubeLoggedIn(true);
    }
    console.log("YouTube access token:", youtubeAccessToken);
  }, []);

  useEffect(() => {
    if (spotifyToken) {
      getUserProfile();
    }
  }, [spotifyToken, getUserProfile]);

  const getPlaylists = async () => {
    const spotify = new SpotifyWebApi();
    spotify.setAccessToken(spotifyToken);
    const playlists = await spotify.getUserPlaylists();
    setPlaylists(playlists.items);
    setShowPlaylists(true);
  };

  const spotifyLogout = () => {
    window.location.href = "http://localhost:8888/spotify-logout";
  };

  const youtubeLogout = () => {
    window.location.href = "http://localhost:8888/youtube-logout";
  };

  return (
    <div className="login-container">
      <div className="spotify-login">
        {spotifyLoggedIn ? (
          <div className="user-profile">
            <p>Welcome {displayName}!</p>
            {userPicture && <img src={userPicture} alt="User Profile" />}{" "}
            <button onClick={spotifyLogout}>Logout of Spotify</button>
          </div>
        ) : (
          <a href="http://localhost:8888/spotify-login">Login to Spotify</a>
        )}
      </div>
      <div className="youtube-login">
        {youtubeLoggedIn ? (
          <button onClick={youtubeLogout}>Logout of YouTube</button>
        ) : (
          <a href="http://localhost:8888/youtube-login">Login to Youtube</a>
        )}
      </div>
      {spotifyLoggedIn ? (
        <div className="playlists">
          {!showPlaylists ? (
            <button onClick={getPlaylists}>Get Playlists</button>
          ) : (
            <button>Convert</button>
          )}
          {playlists.map((playlist) => (
            <div className="playlist-container" key={playlist.id}>
              <input type="checkbox" />
              <img src={playlist.images[0].url} alt={playlist.name + "img"} />
              <p>{playlist.name}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Login;
