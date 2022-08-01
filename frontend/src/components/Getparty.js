import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";

import SpotifyWebApi from "spotify-web-api-node";
import { Container ,Row,Col,Button} from "react-bootstrap";
import useAuth from "../Hooks/useAuth"
import Dashboard from './Dashboard'
export  default  function Getparty({ logcode, clientid, partyCode }) {
  const accessToken = useAuth(logcode);
  const [user, setuser] = useState("");
  const [res2,setRes] = useState();
  const [host,setHost] = useState('')
  const [songs,setSongs] = useState()
  const handleClick = async () => {
    
    try {
      const {data} = await axios.delete(
        'http://localhost:3001/userlogout',
        {data:{token: sessionStorage.getItem('CurrentRefreshToken'),partyCode:partyCode,userName: user}}
        
      );

      
    } catch (err) {
     console.log(err)
    } 
  };
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
            sessionStorage.setItem('CurrentToken', res.data.accessToken);
            sessionStorage.setItem('CurrentRefreshToken', res.data.refreshToken);
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
  useEffect(() => {
    
    const timeout = setInterval(() => {
      console.log("Set interval checking whether token is valid")
      let sessionToken  = sessionStorage.getItem('CurrentToken');
      
      axios
        .post("http://localhost:3001/authenticateJWT", {
          token:sessionToken,
          user:user
        })
        .then((res) => {
          
          if (res.data.result===false){
            console.log("Entered else block")
            axios
            .post("http://localhost:3001/checktoken", {
              token: sessionStorage.getItem('CurrentRefreshToken'),
              username:user
            })
            .then((res) => {
              console.log(res);
              sessionStorage.setItem('CurrentToken', res.data.accessToken);
            })
            .catch((err) => {
              console.log(err);
             
            })
          }
        })
        .catch((err) => {
          console.log(err);
        });
      
      
      
    }, 1000 *5);
    return () => clearInterval(timeout);
  }, []);
  return (
    <div>
       <Col> <p>Party Code: {partyCode}</p></Col><Col></Col><Col></Col><Col><Button onClick={handleClick} variant="primary">Logout</Button>{' '}</Col>
      <p> Hello {user}</p>
      <p>The members are</p>
      <p>{res2}</p><br></br>
      <p>The songs are</p>
      <p>{songs}</p>
      <Dashboard accessToken = {accessToken} code = {logcode}/>
    </div>
  );
}
