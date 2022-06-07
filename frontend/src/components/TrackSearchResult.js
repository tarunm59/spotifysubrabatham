import React from "react";

const TrackSearchResult = ({ track }) => {
  return (
    <div className="d-flex m-2 align-items-center">
      <img
        src={track.albumImageUrl}
        style={{ height: "64px", width: "64px" }}
        alt="album cover"
      />
      <div style={{ marginLeft: "10px" }}>
        <div>{track.title}</div>
        <div className="text-muted">{track.artist}</div>
      </div>
    </div>
  );
};

export default TrackSearchResult;
