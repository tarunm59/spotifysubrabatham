require('dotenv').config() 
const express = require("express");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
const users = [];//basically a database to be created
// app.use(bodyParser.urlencoded({ extended: true }));
app.get('/hosts',authtoken,(req,res)=>{
  
  //database.filter instead.. dont use name cuz we might not need
  res.json(users.filter((user)=>{return user.name===req.user.name}));

});
app.post('/addhost',async (req,res)=>
{
  try
  {

    const salt = await bcrypt.genSalt();

    const hashed= await bcrypt.hash(req.body.password,salt);
    const user = {name:req.body.name, password : hashed}
    users.push(user);
    //replace this section with database.push
    res.status(200).send();
  }
  catch
  {
    
    res.status(400).send();
  }
  
});
app.post('/allhosts/logon',async(req,res)=>
{
  //rplace with database.find
  const user = users.find ((user ) => (user.name==req.body.name));
  if (!user)
  {
    return res.status(400).send("This Party does not exist");

  }
  try{
    if (await bcrypt.compare(req.body.password,user.password))  //credentials are good to go
    {
      
      const jwt_access_token =jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
      res.json({jwt_access_token:jwt_access_token});//might need to remove
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
function authtoken(req,res,next)
{
  const authHeader = req.headers['authorization'];
  const token =authHeader &&  authHeader.split(' ')[1];
  
  if (token==null)
  {
    res.sendStatus(401);
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
    if (err)
    {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
    
  })
}
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
