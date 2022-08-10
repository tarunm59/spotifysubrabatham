// import { Button } from "react-bootstrap";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faX } from "@fortawesome/free-solid-svg-icons";
// import axios from "axios";
// let songKey = 0;

const TrackComponent = ({ track, partyCode }) => {
  let minutes = track.duration / 60000;
  let seconds = 60 * (minutes - Math.floor(minutes));
  minutes = Math.floor(minutes);
  seconds = Math.floor(seconds);

  return (
    <div
      key={track.uri}
      className="d-flex m-2 align-items-center"
      style={{ cursor: "pointer" }}
    >
      <div className="d-flex">
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
      {/* <Button
        style={{ maxHeight: "25px", marginLeft: "3%" }}
        variant="danger"
        className="d-flex justify-content-center align-items-start"
        onClick={(props) => {
          removeSong(track);
        }}
      >
        <FontAwesomeIcon icon={faX} size="xs" />
      </Button> */}
    </div>
  );
};

export default TrackComponent;
