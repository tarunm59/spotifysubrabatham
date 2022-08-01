import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { Container,Button,Row,Col } from "react-bootstrap";
import useAuth from "../Hooks/useAuth"
import Dashboard from './Dashboard'
export default function Addparty({ logcode,clientid }) {
  const accessToken = useAuth(logcode);
  const [user, setuser] = useState("");
  
  const [partyCode, setPartyCode] = useState("");
  
 
  const spotifyApi = new SpotifyWebApi({
    clientId: clientid,
  });
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
      <Row>
        <Col> <p>Party Code: {partyCode}</p></Col><Col></Col><Col></Col><Col><Button onClick={handleClick} variant="primary">Logout</Button>{' '}</Col>
      </Row>
     
      

      <Dashboard accessToken = {accessToken} code = {logcode}/>
    </div>
  );
}
