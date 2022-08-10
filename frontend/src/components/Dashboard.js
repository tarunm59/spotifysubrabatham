// import useAuth from "../Hooks/useAuth";
// import Addparty from "./Addparty";
import { useState, useEffect } from "react";
import { Container, Form, Button } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "./TrackSearchResult";
import Songplay from "./Songplay";
import TrackComponent from "./TrackComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
const spotifyApi = new SpotifyWebApi({
  clientId: "7a561047270c440094df114ec0cbb949",
});

const Dashboard = (props) => {
  // console.log("access token is: " + props.accessToken);
  const [search, setSearch] = useState("");
  // const [ide, setIde] = useState(-1);
  const [currsong, setCurrsong] = useState();
  const [searchResults, setSearchResults] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [removingId, setRemovingId] = useState("");

  // console.log(searchResults);
  function trackchoose(track) {
    setCurrsong(track);
    setSearch("");
  }
  useEffect(() => {
    if (!props.accessToken) {
      return;
    }
    spotifyApi.setAccessToken(props.accessToken);
  }, [props.accessToken]);

  const removeSong = (trackRemoveId) => {
    // Remove the track 'trackRemove' from the Mongo db
    axios
      .delete("http://localhost:3001/removeSong", {
        data: {
          token: sessionStorage.getItem("CurrentToken"),
          partyCode: props.partyCode,
          song: trackRemoveId,
        },
      })
      .then((res) => {
        console.log("REMOVED FROM MONGO");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (selectedTrack !== "") {
      // console.log(selectedTrack);
      setSongs((oldArr) => [
        ...oldArr,
        <div key={selectedTrack.uri} className="d-flex m-2 align-items-center">
          <TrackComponent track={selectedTrack} />
          <Button
            id={selectedTrack.uri}
            key={selectedTrack.uri}
            variant="danger"
            className="d-flex justify-content-center align-items-start"
            onClick={(event) => {
              const removingElementId = event.currentTarget.id;
              setRemovingId(removingElementId);
            }}
          >
            <FontAwesomeIcon icon={faX} size="xs" />
          </Button>
        </div>,
      ]);
      axios
        .post("http://localhost:3001/addSong", {
          partyCode: props.partyCode,
          song: selectedTrack.uri,
        })
        .then((res) => {})
        .catch((err) => {
          console.log(err);
        });
      setSelectedTrack("");
    }
  }, [selectedTrack]);

  useEffect(() => {
    if (removingId !== "") {
      setSongs((products) =>
        products.filter((el, idx) => {
          return el.key !== removingId;
        })
      );
      removeSong(removingId);
      setRemovingId("");
    }
  }, [removingId]);

  useEffect(() => {
    if (!search) {
      return setSearchResults([]);
    }

    if (!props.accessToken) {
      return;
    }
    let cancel = false;
    spotifyApi
      .searchTracks(search)
      .then((res) => {
        if (cancel) {
          return;
        }
        setSearchResults(
          res.body.tracks.items.map((track) => {
            const smallAlbumImage = track.album.images.reduce(
              (smallest, image) => {
                if (image.height < smallest.height) return image;
                return smallest;
              },
              track.album.images[0]
            );

            return {
              artist: track.artists[0].name,
              title: track.name,
              uri: track.uri,
              albumImageUrl: smallAlbumImage.url,
              duration: track.duration_ms,
            };
          })
        );
      })
      .catch((e) => console.log(e));
    return () => {
      cancel = true;
    };
  }, [search, props.accessToken]);

  return (
    <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
      Welcome to the party!
      <Form.Control
        type="search"
        placeholder="Search over 70 million songs"
        value={search}
        style={{ marginTop: "10px" }}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      <div className="flex-grow-1 my-2" stye={{ overflowY: "auto" }}>
        {searchResults.map((track) => (
          <div key={track.uri}>
            <TrackSearchResult
              partyCode={props.partyCode}
              track={track}
              key={track.uri}
              choose={trackchoose}
              selectedTrack={selectedTrack}
              setSelectedTrack={setSelectedTrack}
            />
          </div>
        ))}
      </div>
      <div>{songs}</div>
      <div>
        <Songplay accessToken={props.accessToken} trackUri={currsong?.uri} />
      </div>
    </Container>
  );
};

export default Dashboard;
