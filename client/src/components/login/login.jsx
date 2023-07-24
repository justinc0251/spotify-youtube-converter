import React, { useEffect, useState, useCallback } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import "./login.css";
import axios from "axios";

const Login = () => {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [userPicture, setUserPicture] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [spotifyLoggedIn, setSpotifyLoggedIn] = useState(false);
  const [youtubeToken, setYoutubeToken] = useState("");
  const [youtubeLoggedIn, setYoutubeLoggedIn] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [conversionStatuses, setConversionStatuses] = useState({});

  // Function to get the access token from localStorage
  const getAccessTokenFromStorage = (key) => {
    return localStorage.getItem(key);
  };

  // Function to set the access token in localStorage
  const setAccessTokenToStorage = (key, token) => {
    localStorage.setItem(key, token);
  };

  // Function to clear the access token from localStorage
  const clearAccessTokenFromStorage = (key) => {
    localStorage.removeItem(key);
  };

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
    const youtubeToken = getYouTubeTokenFromUrl();

    // Check if access tokens are already in localStorage (e.g., after a page refresh)
    if (!spotifyToken && getAccessTokenFromStorage("spotifyAccessToken")) {
      setSpotifyToken(getAccessTokenFromStorage("spotifyAccessToken"));
      setSpotifyLoggedIn(true);
    }

    if (!youtubeToken && getAccessTokenFromStorage("youtubeAccessToken")) {
      setYoutubeToken(getAccessTokenFromStorage("youtubeAccessToken"));
      setYoutubeLoggedIn(true);
    }

    window.location.hash = "";
    if (spotifyToken) {
      setSpotifyToken(spotifyToken);
      setSpotifyLoggedIn(true);
      // Save Spotify access token to localStorage
      setAccessTokenToStorage("spotifyAccessToken", spotifyToken);
    }
    if (youtubeToken) {
      setYoutubeToken(youtubeToken);
      setYoutubeLoggedIn(true);
      // Save YouTube access token to localStorage
      setAccessTokenToStorage("youtubeAccessToken", youtubeToken);
    }
    console.log("YouTube access token:", youtubeToken);
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
    // Clear Spotify access token from localStorage
    clearAccessTokenFromStorage("spotifyAccessToken");
    window.location.href = "http://localhost:8888/spotify-logout";
  };

  const youtubeLogout = () => {
    // Clear YouTube access token from localStorage
    clearAccessTokenFromStorage("youtubeAccessToken");
    window.location.href = "http://localhost:8888/youtube-logout";
  };

  const convertToYouTubePlaylist = async (spotifyPlaylistId) => {
    try {
      const response = await axios.get(
        `http://localhost:8888/convert-to-youtube?spotifyPlaylistId=${spotifyPlaylistId}`,
        {
          headers: {
            Authorization: `Bearer ${youtubeToken}`,
          },
        }
      );
      console.log(response.data.message);
      setConversionStatuses((prevStatuses) => ({
        ...prevStatuses,
        [spotifyPlaylistId]: "Success",
      }));
    } catch (error) {
      console.error("Error converting to YouTube playlist:", error);
    }
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
            ""
          )}
          {playlists.map((playlist) => (
            <div className="playlist-container" key={playlist.id}>
              <img src={playlist.images[0].url} alt={playlist.name + "img"} />
              <p>{playlist.name}</p>
              <button onClick={() => convertToYouTubePlaylist(playlist.id)}>
                {conversionStatuses[playlist.id] === "Success"
                  ? "Success!"
                  : "Convert"}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Login;
