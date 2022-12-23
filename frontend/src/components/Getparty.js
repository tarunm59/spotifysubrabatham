import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";

import SpotifyWebApi from "spotify-web-api-node";
import { Col, Button,Row } from "react-bootstrap";
import useAuth from "../Hooks/useAuth";
import Dashboard from "./Dashboard";
export default function Getparty({ logcode, clientid, partyCode }) {
  const accessToken = useAuth(logcode);
  const [user, setuser] = useState("");
  const [res2, setRes] = useState();
  // const [host, setHost] = useState("");
  const [songs, setSongs] = useState();
  const handleClick = async () => {
    axios
      .delete("http://localhost:3001/userlogout", {
        data: {
          token: sessionStorage.getItem("CurrentRefreshToken"),
          partyCode: partyCode,
          userName: user,
        },
      })
      .then((res) => {
        // console.log(res);
        if (res.status === 200) {
          sessionStorage.clear();
          sessionStorage.clear();
          window.location = "/";
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // console.log("CODE FOR THE PART IS: ", partyCode);

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
          .get("http://localhost:3001/getParty", {
            params: { partyCode: partyCode, username: dataname },
          })
          .then((res) => {
            // console.log(res.data);
            sessionStorage.setItem("CurrentToken", res.data.accessToken);
            sessionStorage.setItem(
              "CurrentRefreshToken",
              res.data.refreshToken
            );
            setRes(res.data.party.members);
            setSongs(JSON.stringify(res.data.party.songs));
          })
          .catch((err) => {
            console.log(err);
            setRes(err);
          });
      },
      function (err) {
        setuser(err);
        console.log("Something went wrong!", err);
      }
    );
  }, [accessToken]);
  useEffect(() => {
    if (!user) {
      return;
    }
    const timeout = setInterval(() => {
      // console.log("Set interval checking whether token is valid");
      let sessionToken = sessionStorage.getItem("CurrentToken");

      axios
        .post("http://localhost:3001/authenticateJWT", {
          token: sessionToken,
          user: user,
        })
        .then((res) => {
          if (res.data.result === false) {
            axios
              .post("http://localhost:3001/checktoken", {
                token: sessionStorage.getItem("CurrentRefreshToken"),
                username: user,
              })
              .then((res) => {
                // console.log(res);
                sessionStorage.setItem("CurrentToken", res.data.accessToken);
              })
              .catch((err) => {
                console.log(err);
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }, 1000 * 5);
    return () => clearInterval(timeout);
  }, [user]);
  return (
    
    <div>
      
      
      <Row style={{ maxWidth: "100%" }}>
        
        
        <Col >
        </Col>
        <Col className="d-flex justify-content-left">
          {" "}
          <p>Party Code: {partyCode}</p>
        </Col>
        
        <Col></Col>
        <Col className="d-flex justify-content-center">
          <Button
            style={{ marginTop: "10px" }}
            onClick={handleClick}
            variant="primary"
          >
            Logout
          </Button>{" "}
        </Col>
        <Row>
          <Col></Col>
        <Col>
         
          </Col>
          <Col ></Col>
          <Col className="d-flex justify-content-left">
          {" "}
          <p> Hello {user}</p></Col><Col></Col>
        </Row>
      </Row>
    
      <Row>
        <Col>
         Members
        <br></br>
       <br></br>
        {res2}
        </Col>
        
        
        <Col xs={8} md = {8} lg = {11}><Dashboard
        accessToken={accessToken}
        code={logcode}
        partyCode={partyCode}
      /></Col>
        
      </Row>
        
      
      
      
       
        
      
      
    </div>
  );
}
