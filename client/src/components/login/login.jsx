import React, { useEffect, useState, useCallback } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import "./login.css";
import axios from "axios";
import spotifyLogo from "../../assets/spotify.png";
import youtubeLogo from "../../assets/youtube.png";

const Login = () => {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [spotifyUserPicture, setSpotifyUserPicture] = useState("");
  const [spotifyDisplayName, setSpotifyDisplayName] = useState("");
  const [youtubeUserPicture, setYouTubeUserPicture] = useState("");
  const [youtubeDisplayName, setYouTubeDisplayName] = useState("");
  const [spotifyLoggedIn, setSpotifyLoggedIn] = useState(false);
  const [youtubeToken, setYoutubeToken] = useState("");
  const [youtubeLoggedIn, setYoutubeLoggedIn] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [conversionStatuses, setConversionStatuses] = useState({});
  const [playlistLinks, setPlaylistLinks] = useState({});

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

  const getSpotifyUserProfile = useCallback(async () => {
    const spotify = new SpotifyWebApi();
    spotify.setAccessToken(spotifyToken);
    const user = await spotify.getMe();
    console.log(user);

    if (user.images && user.images.length > 0) {
      setSpotifyUserPicture(user.images[0].url); // Set the user's profile picture
    }
    setSpotifyDisplayName(user.display_name); // Set the user's display name
  }, [spotifyToken]);

  const getYouTubeUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "snippet",
            mine: true,
            access_token: youtubeToken,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        setYouTubeUserPicture(channel.snippet.thumbnails.default.url); // Set the user's YouTube profile picture
        setYouTubeDisplayName(channel.snippet.title); // Set the user's YouTube display name
      }
    } catch (error) {
      console.error("Error fetching YouTube user profile:", error);
    }
  }, [youtubeToken]);

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
  }, []);

  useEffect(() => {
    if (spotifyToken) {
      getSpotifyUserProfile();
    }
    if (youtubeToken) {
      getYouTubeUserProfile();
      console.log("YouTube access token:", youtubeToken);
    }
  }, [
    spotifyToken,
    getSpotifyUserProfile,
    youtubeToken,
    getYouTubeUserProfile,
  ]);

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
    setConversionStatuses((prevStatuses) => ({
      ...prevStatuses,
      [spotifyPlaylistId]: "Converting",
    }));
    try {
      const response = await axios.get(
        `http://localhost:8888/convert-to-youtube?spotifyPlaylistId=${spotifyPlaylistId}`,
        {
          headers: {
            YouTubeAuthorization: `Bearer ${youtubeToken}`,
            // Include the Spotify access token in the request headers
            SpotifyAuthorization: `Bearer ${spotifyToken}`,
          },
        }
      );
      console.log(response.data.message);
      setConversionStatuses((prevStatuses) => ({
        ...prevStatuses,
        [spotifyPlaylistId]: "Success",
      }));
      if (response.data && response.data.youtubePlaylistLink) {
        // Update the playlist link for the specific playlist being converted
        setPlaylistLinks((prevLinks) => ({
          ...prevLinks,
          [spotifyPlaylistId]: response.data.youtubePlaylistLink,
        }));
      }
    } catch (error) {
      console.error("Error converting to YouTube playlist:", error);
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        {!spotifyLoggedIn || !youtubeLoggedIn ? (
          <h3 className="instruction">
            Sign in to both services to get started!
          </h3>
        ) : null}
        <div className="spotify-login">
          {spotifyLoggedIn ? (
            <div className="user-profile">
              <p className="spotify-name">{spotifyDisplayName}</p>
              {spotifyUserPicture && (
                <img
                  className="spotify-pic"
                  src={spotifyUserPicture}
                  alt="User Profile"
                />
              )}{" "}
              <button className="logout" onClick={spotifyLogout}>
                Logout
              </button>
            </div>
          ) : (
            <a href="http://localhost:8888/spotify-login">
              <img
                className="spotify-logo"
                src={spotifyLogo}
                alt="Spotify Logo"
              />
            </a>
          )}
        </div>
        <i class='bx bxs-chevrons-right'></i>
        <div className="youtube-login">
          {youtubeLoggedIn ? (
            <div className="user-profile">
              <p className="youtube-name">{youtubeDisplayName}</p>
              {youtubeUserPicture && (
                <img
                  className="youtube-pic"
                  src={youtubeUserPicture}
                  alt="YouTube Profile"
                />
              )}
              <button className="logout" onClick={youtubeLogout}>
                Logout
              </button>
            </div>
          ) : (
            <a href="http://localhost:8888/youtube-login">
              <img
                className="youtube-logo"
                src={youtubeLogo}
                alt="YouTube Logo"
              />
            </a>
          )}
        </div>
      </div>
      {spotifyLoggedIn && youtubeLoggedIn ? (
        <div className="playlists">
          {!showPlaylists ? (
            <button className="get-playlists" onClick={getPlaylists}>
              Get Playlists
            </button>
          ) : (
            <button
              className="get-playlists"
              onClick={() => setShowPlaylists(false)}
            >
              Hide Playlists
            </button>
          )}
          {showPlaylists
            ? playlists.map((playlist) => (
                <div className="playlist-container" key={playlist.id}>
                  <div className="playlist-info">
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name + "img"}
                    />
                    <p>{playlist.name}</p>
                    {conversionStatuses[playlist.id] === "Success" ? (
                      <a
                        href={playlistLinks[playlist.id]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <button>View Playlist</button>
                      </a>
                    ) : conversionStatuses[playlist.id] === "Converting" ? (
                      <button disabled>Converting...</button>
                    ) : (
                      <button
                        onClick={() => convertToYouTubePlaylist(playlist.id)}
                      >
                        Convert
                      </button>
                    )}
                  </div>
                </div>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

export default Login;
