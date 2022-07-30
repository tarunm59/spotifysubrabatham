import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";

import SpotifyWebApi from "spotify-web-api-node";
import { Container } from "react-bootstrap";
import useAuth from "../Hooks/useAuth"
import Dashboard from './Dashboard'
export  default  function Getparty({ logcode, clientid, partyCode }) {
  const accessToken = useAuth(logcode);
  const [user, setuser] = useState("");
  const [res2,setRes] = useState();
  const [host,setHost] = useState('')
  const [songs,setSongs] = useState()
  console.log(partyCode)
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
          .get("http://localhost:3001/getParty",{ params: { partyCode: partyCode,username:user } })
          .then((res) => {
            console.log(res.data);
            setRes(JSON.stringify(res.data.party.members))
            setSongs(JSON.stringify(res.data.party.songs))
          })
          .catch((err) => {
            console.log(err);
            setRes(JSON.stringify(err))
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
      <p> Hello {user}</p>
      <p>The members are</p>
      <p>{res2}</p><br></br>
      <p>The songs are</p>
      <p>{songs}</p>
      <Dashboard accessToken = {accessToken} code = {logcode}/>
    </div>
  );
}
