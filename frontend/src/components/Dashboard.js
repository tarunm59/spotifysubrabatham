import useAuth from "../Hooks/useAuth";
import Addparty from "./Addparty";
import { useState, useEffect } from "react";
import { Container, Form } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "./TrackSearchResult";
import Songplay from "./songplay";
const spotifyApi = new SpotifyWebApi({
  clientId: "7a561047270c440094df114ec0cbb949",
});

const Dashboard = (props) => {
  
  console.log("access token is: " + props.accessToken);
  const [search, setSearch] = useState("");
  const [currsong, setCurrsong] = useState();
  const [searchResults, setSearchResults] = useState([]);
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
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      <div className="flex-grow-1 my-2" stye={{ overflowY: "auto" }}>
        {searchResults.map((track) => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            choose={trackchoose}
          />
        ))}
      </div>
      <div>
        <Songplay accessToken={props.accessToken} trackUri={currsong?.uri} />
      </div>
    </Container>
  );
};

export default Dashboard;
