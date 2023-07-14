import React from "react";

const login = () => {
  const CLIENT_ID = "cc0d89178adb47e7b067458024c52f16";
  const REDIRECT_URI = "http://localhost:3000";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  return (
    <div className="login-container">
      <div className="spotify-login">
        <a
          href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
        >
          Login to Spotify
        </a>
      </div>
      <div className="youtube-login">
        <a href="http://localhost:8888/login">Login to Youtube</a>
      </div>
    </div>
  );
};

export default login;
