const express = require("express");

const SpotifyWebApi = require("spotify-web-api-node");

const app = express();

app.post("/login", (req, res) => {
  const code = req.body.code;
  console.log(code);
  const spotifyApi = new SpotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientid: "7a561047270c440094df114ec0cbb949",
    clientSecret: "3c8f204a68fc4aa8b9a5891579a673e9",
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
      console.log(data.body);
    })
    .catch((err) => {
      res.sendStatus(400);
      console.log(err);
    });
});
