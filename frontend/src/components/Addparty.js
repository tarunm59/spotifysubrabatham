import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { Container } from "react-bootstrap";
import useAuth from "../Hooks/useAuth"
import Dashboard from './Dashboard'
export default function Addparty({ logcode,clientid }) {
  const accessToken = useAuth(logcode);
  const [user, setuser] = useState("");
  const [partyCode, setPartyCode] = useState("");
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
          .post("http://localhost:3001/createParty", {
            username: user,
          })
          .then((res) => {
            sessionStorage.setItem('CurrentToken', res.data.accessToken);
            sessionStorage.setItem('CurrentRefreshToken', res.data.refreshToken);
            setPartyCode(res.data.party.partyCode);
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
      <p>Party Code: {partyCode}</p>
      <Dashboard accessToken = {accessToken} code = {logcode}/>
    </div>
  );
}
