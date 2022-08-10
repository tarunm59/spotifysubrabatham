// import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
let songKey = 1;

const TrackSearchResult = ({ track, choose, setSelectedTrack }) => {
  // let [ide, setIde] = useState(-1);
  // let [toRemove, setToRemove] = useState(false);
  let minutes = track.duration / 60000;
  let seconds = 60 * (minutes - Math.floor(minutes));
  minutes = Math.floor(minutes);
  seconds = Math.floor(seconds);

  // const removeSong = (trackRemove) => {
  //   // Remove the track 'trackRemove' from the Mongo db
  //   axios
  //     .delete("http://localhost:3001/removeSong", {
  //       data: {
  //         token: sessionStorage.getItem("CurrentToken"),
  //         partyCode: partyCode,
  //         song: trackRemove.title,
  //       },
  //     })
  //     .then((res) => {
  //       console.log("REMOVED FROM MONGO");
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // };

  const handlePlay = () => {
    choose(track);

    // console.log("track", track);

    // setSongs((oldArray) => [
    //   ...oldArray,
    //   <div
    //     key={songKey}
    //     className="d-flex m-2 align-items-center"
    //     style={{ cursor: "pointer" }}
    //   >
    //     <div className="d-flex">
    //       <img
    //         src={track.albumImageUrl}
    //         style={{ height: "64px", width: "64px" }}
    //         alt="album cover"
    //       />
    //       <div style={{ marginLeft: "10px" }}>
    //         <div>
    //           {track.title} [{minutes}:{seconds < 10 ? "0" + seconds : seconds}]
    //         </div>
    //         <div className="text-muted">{track.artist}</div>
    //       </div>
    //     </div>
    //     <Button
    //       data-identifier={songKey}
    //       style={{ maxHeight: "25px", marginLeft: "3%" }}
    //       variant="danger"
    //       className="d-flex justify-content-center align-items-start"
    //       onClick={(props) => {
    //         // const valueIde = props.target.getAttribute("data-identifier");
    //         // setIde(valueIde);
    //         // console.log("The key here is: ", valueIde);
    //         // setToRemove(true);
    //         // removeSong(track);
    //       }}
    //     >
    //       <FontAwesomeIcon icon={faX} size="xs" />
    //     </Button>
    //   </div>,
    // ]);

    // songKey++;

    // axios
    //   .post("http://localhost:3001/addSong", {
    //     partyCode: partyCode,
    //     song: track.title,
    //   })
    //   .then((res) => {})
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };
  return (
    <div
      className="d-flex m-2 align-items-center"
      style={{ cursor: "pointer" }}
      onClick={() => {
        handlePlay();
        setSelectedTrack(track);
      }}
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
