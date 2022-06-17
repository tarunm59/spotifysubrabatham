 const express = require("express");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
app.use(cors());
app.use(bodyParser.json());
const users = [1,2,3];
// app.use(bodyParser.urlencoded({ extended: true }));
app.get('/allhosts',(req,res)=>{
  res.json(users)
});
app.post('/addhost',async (req,res)=>
{
  try
  {

    const salt = await bcrypt.genSalt();

    const hashed= await bcrypt.hash(req.body.password,salt);
    const user = {name:req.body.name, password : hashed}
    users.push(user);
    console.log(users)
    res.status(200).send();
  }
  catch
  {
    
    res.status(400).send();
  }
  
});
app.post('/allhosts/login',async(req,res)=>
{
  
  const user = users.find ((user ) => (user.name==req.body.name));
  if (!user)
  {
    return res.status(400).send("This Party does not exist");

  }
  try{
    if (await bcrypt.compare(req.body.password,user.password))  
    {
      res.send("Success Joining Party as Host");
    } 
    else
    {
      res.send("Invalid party host credentials");
    }
  }
  catch
  {
    res.status(400).send();
  }
});
app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientId: "7a561047270c440094df114ec0cbb949",
    clientSecret: "3c8f204a68fc4aa8b9a5891579a673e9",
    refreshToken,
  });
  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      console.log("The access token has been refreshed!");
      res.json({
        accessToken: data.body.accessToken,
        expiresIn: data.body.expiresIn,
      });
      // Save the access token so that it's used in future calls
      // spotifyApi.setAccessToken(data.body["access_token"]);
    })
    .catch((err) => {
      console.log("Could not refresh access token", err);
      // console.log(err);
      res.sendStatus(400);
    });
});

app.post("/login", (req, res) => {
  const code = req.body.code;
  // console.log(code);
  const spotifyApi = new SpotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientId: "7a561047270c440094df114ec0cbb949",
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
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});
app.listen(3001);
