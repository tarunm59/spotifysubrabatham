import React from "react";

const TrackSearchResult = ({ track }) => {
  let minutes = track.duration / 60000;
  let seconds = 60 * (minutes - Math.floor(minutes));
  minutes = Math.floor(minutes);
  seconds = Math.floor(seconds);
  const handlePlay = () => {
    // function that handles playing the song.
    // Tarun look here.
  };
  return (
    <div
      className="d-flex m-2 align-items-center"
      style={{ cursor: "pointer" }}
      onClick={() => handlePlay()}
    >
      <img
        src={track.albumImageUrl}
        style={{ height: "64px", width: "64px" }}
        alt="album cover"
      />
      <div style={{ marginLeft: "10px" }}>
        <div>
          {track.title} [{minutes}:{seconds < 10 ? "0" + seconds : seconds}]
        </div>
        <div className="text-muted">{track.artist}</div>
      </div>
    </div>
  );
};

export default TrackSearchResult;
