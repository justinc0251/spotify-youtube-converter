import React from "react";

const Input = () => {
  return (
    <div className="input-container">
      <h1>Spotify-Youtube Playlist Converter</h1>
      <p>Convert your Spotify playlists to Youtube playlists.</p>
      <p>Enter your Spotify playlist URL below:</p>
      <form>
        <input type="text" name="spotify-playlist-url" />
        <input type="submit" value="Convert" />
      </form>
    </div>
  );
};

export default Input;
