import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { Container } from "react-bootstrap";

export default function Getparty({ accessToken, clientid, partyCode }) {
  const [user, setuser] = useState("");
  const spotifyApi = new SpotifyWebApi({
    clientId: clientid,
  });

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.getMe().then(
      function (data) {
        let dataname = data.body.display_name;
        setuser(dataname);
        axios
          .post("http://localhost:3001/getParty", {
            username: user,
            partyCode: partyCode,
            accessToken: accessToken,
          })
          .then((res) => {
            console.log(res.data);
          })
          .catch((err) => {
            console.log(err);
          });
      },
      function (err) {
        setuser(err);
        console.log("Something went wrong!", err);
      }
    );
  }, [accessToken]);

  return (
    <div>
      <p>successfully logged in!</p>
      <p>Party Code: {partyCode}</p>
    </div>
  );
}
