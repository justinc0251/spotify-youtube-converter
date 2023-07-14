import React from "react";

const login = () => {
  return (
    <div className="login-container">
      <div className="spotify-login">
        <a href="http://localhost:8888/login">Login to Spotify</a>
      </div>
      <div className="youtube-login">
        <a href="http://localhost:8888/login">Login to Youtube</a>
      </div>
    </div>
  );
};

export default login;
