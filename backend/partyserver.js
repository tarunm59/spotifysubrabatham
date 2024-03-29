require("dotenv").config();


const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const SpotifyWebApi = require("spotify-web-api-node");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const assert = require("assert");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");
const { response } = require("express");
const { io } = require("socket.io-client");

let spotifyAccessToken = null;

// Setting up the app.
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Setting up mongodb
const dbUrl = process.env.DB_URL;
const client = new MongoClient(dbUrl);

//connecting to mongo
const connection = async () => {
  await client.connect();
  console.log("Connected to MongoDB");
};
connection();
// The client can now be used to write to mongo

const partyCol = client.db("Partydb").collection("test");
const secretCol = client.db("Partydb").collection("testSecret");





//**************************************************************************************** */
// TOKEN MANAGEMENT
//**************************************************************************************** */



// Authenticates the auth token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const username = req.body.username;
  if (token == null) {
    res.sendStatus(401);
  }

  let cursor = secretCol.find();
  let tokens = await cursor.toArray();
  let [isPresent, tokenPointer] = await checkForUsername(username, tokens);

  if (!isPresent) {
    // token is present
    res.sendStatus(401);
    console.log("Username not found.");
    return;
  }

  let secretObject = tokens[tokenPointer];
  console.log(secretObject.accessSecret);
  jwt.verify(token, secretObject.accessSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

//**************************************************************************************** */
// PARTY AND USER MANAGEMENT
//**************************************************************************************** */

/* 
    CREATE PARTY ENDPOINT
    req contains: 
        String: Spotify username of user creating the party
    Generates a 6 digit party code
    Creates a party in mongodb
    Salts and hashes the required data into mongodb
    Creates a party authorisation token for the user
    Returns the access token, refresh token and the party
*/
app.post("/authenticateJWT", async (req, res) => {
  var token = req.body.token
  var user = req.body.user
  let secretCursor = secretCol.find();
  let accessarray = await secretCursor.toArray();
  let accessTokenSecret ;
  for (let person in accessarray)

  {
    if(user===accessarray[person]['username']){
      accessTokenSecret = accessarray[person]['accessSecret'];
    }
  }
  
  jwt.verify(token, accessTokenSecret, function(err, decoded) {
    if (!err) {
    return res.json({result:true})
    } else {
     
    return res.json({result:false})
    }
  });
  
  
  
 
  
});
app.post("/createParty", async (req, res) => {
  try {
    // Getting username and partyCode
    const hostUsername = req.body.username;
    let partyCode = codeGen(6);

    // Checking if partyCode already exists
    let cursor = partyCol.find().project({ partyCode: 1, _id: 0 });
    let parties = await cursor.toArray();

    while (await checkCode(partyCode, parties)[0]) {
      partyCode = codeGen(6);
    }

    // Hashing code and username
    
    const hashedCode = await bcrypt.hash(partyCode, await bcrypt.genSalt());
    
    // Creating the party
    const newPartyInfo = {
      partyCode: hashedCode,
      partyTime: new Date(),
      hostUsername: hostUsername,
      members: [hostUsername],
      songs: [],
      currentSong: "",
      numberActive: 1,
    };
    const infoCopy = {
      partyCode: partyCode,
      partyTime: new Date(),
      hostUsername: hostUsername,
      members: [hostUsername],
      songs: [],
      currentSong: "",
      numberActive: 1,
    };

    // Pushing the data to Mongo
    partyCol.insertOne(newPartyInfo, (err, result) => {
      assert.equal(err, null);
      console.log("Party added to MongoDB"); //REMOVE
      console.log(result); //REMOVE
    });

    // Generate authtoken and refresh token for the user.
    const tokenUser = {
      partyCodeHashed: hashedCode,
      hashedUsername: hostUsername,
    };
    let seccursor =  secretCol.find();
    let secrets = await seccursor.toArray();
    let exist = false;
    let reftoken = null;
    
    for (let index in secrets){
     
      let item = secrets[index];
      let name= item['username']
      
      if( hostUsername===name){
        exist=true;
        reftoken = item['refreshToken'];
      }
     
    }
    if (exist==false){
      const tokens = await genAccess(tokenUser,hostUsername);
      console.log(tokens)
      const response = {
        accessToken: tokens[0],
        refreshToken: tokens[1],
        party: infoCopy,
      };
   //add access token to local(here)
      return res.json(response);
    }
    else{
      const tokens = await genOnlyAccess(hostUsername);
    
    const response = {
      accessToken: tokens,
      refreshToken: reftoken,
      party: infoCopy,
    };
 //add access token to local(here)
    return res.json(response);
    }
  } catch {
    res.status(400).send();
  }
});

/* 
    RETRUN PARTY ENDPOINT
    Used for logging into the app
    req contains: 
        String: partyCode : The party code for the party
    Checks for the party in MongoDB
    Creates a party authorisation token for the user
    returns the party
*/
app.get("/getParty", async (req, res) => {
  let partyCode = req.query.partyCode;
  let username = req.query.username;
  
  
  console.log(req.headers)
  let cursor = partyCol.find();
  let parties = await cursor.toArray();
  let partyCopy = parties;

  for (i in parties.length) {
    parties[i] = parties[i].partyCode;
  }

  let [exists, atIndex] = await checkCode(partyCode, parties);
  console.log("her")
  if (exists) {
    // The party exists
   
    // Generating refresh and access tokens for the user.
    const tokenUser = {
      partyCodeHashed: partyCopy[atIndex].partyCode,
      hashedUsername: username,
    };
    let cursor =  secretCol.find();
    let secrets = await cursor.toArray();
    let exist = false;
    let reftoken = null;
    
    for (let index in secrets){
      console.log(index)
      let item = secrets[index];
      let hashname= item['username']
      
      if( username===hashname){
        exist=true;
        reftoken = item['refreshToken'];
      }
     
    }
    console.log(exist)
    if (exist==true){
      let accessToken= await genOnlyAccess(username);
      const response = {
        accessToken:accessToken,
        refreshToken:reftoken,
        party: partyCopy[atIndex]
      }
      let membersArr = partyCopy[atIndex].members;
      let exist2=false
      for (let i in membersArr){
        member = membersArr[i];
        if (username===member){
            exist2=true
        }
      }
    // Updating the members array in mongo.
    let unameArray = membersArr;
    if (exist2==false){
      unameArray.push(username);
    }
    
    const updatedArray = {
      members: unameArray,
    };
    partyCol.updateOne(
      { partyCode: partyCopy[atIndex].partyCode },
      { $set: updatedArray }
    );
    console.log("Added the user to mongo array for the party.");
    // Sending the response to the user.
    res.json(response);
    }
    else{
      const tokens = await genAccess(tokenUser,username);
  
      const response = {
      accessToken: tokens[0],
      refreshToken: tokens[1],
      party: partyCopy[atIndex],
      };
      
      let membersArr = partyCopy[atIndex].members;
      let exist2=false
      for (let i in membersArr){
        member = membersArr[i];
        if (username===member){
            exist2=true
        }
      }
    // Updating the members array in mongo.
    let unameArray = membersArr;
    if (exist2==false){
      unameArray.push(username);
    }
    
    const updatedArray = {
      members: unameArray,
    };
    partyCol.updateOne(
      { partyCode: partyCopy[atIndex].partyCode },
      { $set: updatedArray }
    );
    console.log("Added the user to mongo array for the party.");
    // Sending the response to the user.
    res.json(response);
    }
    

    
  } else {
    let errorFinding = "Party Not Found!";
    console.log(errorFinding);
    res.sendStatus(400);
  }
});

// The user logs out
// The user logs out
app.delete("/userlogout", async (req, res) => {
  const reftoken = req.body.token;
  const partyCode = req.body.partyCode;
  const userName = req.body.userName;
  let partycursor = partyCol.find();
  let parties = await partycursor.toArray();
  let partyCopy = parties;

  for (i in parties.length) {
    parties[i] = parties[i].partyCode;
  }

  let [exists, atIndex] = await checkCode(partyCode, parties);
  if (exists) {
    let party = partyCopy[atIndex];
    let members1 = party["members"];
    let membersupdated = [];
    for (let member in members1) {
     
      if (userName===members1[member]) {
      } else {
        membersupdated.push(members1[member]);
      }
    }
    const filter = { partyCode: partyCopy[atIndex]["partyCode"] };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        members: membersupdated,
      },
    };
    const result = await partyCol.updateOne(filter, updateDoc, options);
    console.log(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
    );
  let cursor = secretCol.find();
  let secrets = await cursor.toArray();
  console.log("secrets created");
  for (let secret in secrets) {
    item = secrets[secret];
    token = item["refreshToken"];

    if (reftoken === token) {
      let deleted = await secretCol.deleteOne({ refreshToken: reftoken });
      if (deleted.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("This doc didnt match");
      }
    }
  }

  console.log("Secret Removed");
  //replacing the mongo parties accordingly and send back to landing page
  
  } else {
    res.sendStatus(403);
  }
  res.sendStatus(200);
});

// Endpoint to refresh the acces token using refresh token
app.post("/checktoken", async (req, res) => {
  const rtoken = req.body.token;
  const name = req.body.username;
  if (!rtoken) {
    return res.sendStatus(401);
  }
  let cursor = secretCol.find();
  let secrets = await cursor.toArray();
  let includebool = false;
  let refsecret = "";

  for (let secret in secrets) {
    let item = secrets[secret];
    let token = item["refreshToken"];

    if (token === rtoken) {
      includebool = true;

      refsecret = item["refreshSecret"];
    }
  }

  if (includebool == false) {
    return res.sendStatus(403);
  }
  jwt.verify(rtoken, refsecret, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    const accessToken = await genOnlyAccess(name);
    res.json({ accessToken: accessToken });
  });
});

const genOnlyAccess = async (user) => {
  let secretCursor = secretCol.find();
  let accessarray = await secretCursor.toArray();
  let accessTokenSecret = crypto.randomBytes(64).toString("hex");
  for (let person in accessarray) {
    if (user===accessarray[person]['username']) {
      accessTokenSecret = accessarray[person]["accessSecret"];
    }
  }

  const accessToken = jwt.sign({ user: user }, accessTokenSecret, {
    expiresIn: "1800s",
  });
  return accessToken;
};

// Creates an auth token and auth token secret for the user.
const genAccess = async (user, name) => {
  // Generating access and refresh token secrets
  const accessTokenSecret = crypto.randomBytes(64).toString("hex");
  const refreshTokenSecret = crypto.randomBytes(64).toString("hex");

  const accessToken = jwt.sign(user, accessTokenSecret, {
    expiresIn: "1800s",
  });
  const refreshToken = jwt.sign(user, refreshTokenSecret, {
    expiresIn: "345000s",
  });
  const accessSecretData = {
    partyCode: user.partyCodeHashed,
    username: user.hashedUsername,
    accessSecret: accessTokenSecret,
    refreshSecret: refreshTokenSecret,
    refreshToken: refreshToken,
  };
  let cursor = secretCol.find();
  let secrets = await cursor.toArray();

  exist = false;
  for (let secret in secrets) {
    item = secrets[secret];
    if (name===item['username']) {
      exist = true;
    }
  }

  if (exist == false) {
    secretCol.insertOne(accessSecretData, (err, result) => {
      if (err == null) {
        console.log("Token information written");
      } else {
        console.log(err);
      }
    });
  }
  return [accessToken, refreshToken];
};
//**************************************************************************************** */
// SONG MANAGEMENT
//**************************************************************************************** */

app.post("/addSong", async (req, res) => {
  const partyCode = req.body.partyCode;
  const song = req.body.song;
  let cursor = partyCol.find();
  const parties = await cursor.toArray();
  let [present, index] = await checkCode(partyCode, parties);
  if (!present) {
    res.sendStatus(400);
    return;
  }
  let currParty = parties[index];
  let songs = currParty.songs;
  songs.push(song);

  partyCol.updateOne(
    { partyCode: parties[index].partyCode },
    { $set: { songs: songs } }
  );
  res.json({ songs: songs });
  console.log("added song to party");
});

app.delete("/removeSong", async (req, res) => {
  const partyCode = req.body.partyCode;
  const song = req.body.song;
  let cursor = partyCol.find();
  let parties = await cursor.toArray();

  let [songPresent, currParty, songIdx, index] = await songIsPresent(
    partyCode,
    parties,
    song
  );

  if (!songPresent) {
    res.sendStatus(400);
    return;
  }

  let songs = currParty.songs;
  let songCopy = [];
  for (let i = 0; i < songs.length; i++) {
    if (i != songIdx) {
      songCopy.push(songs[i]);
    }
  }

  partyCol.updateOne(
    { partyCode: parties[index].partyCode },
    { $set: { songs: songCopy } }
  );
  res.json({ songs: songCopy });
  console.log("Song removed from Mongo");
});

app.post("/updateSongList", authenticateToken, async (req, res) => {
  const partyCode = req.body.partyCode;
  const song = req.body.song;
  const position = req.body.position - 1;
  let cursor = partyCol.find();
  let parties = await cursor.toArray();

  let [songPresent, currParty, songIdx, index] = await songIsPresent(
    partyCode,
    parties,
    song
  );
  if (!songPresent) {
    res.sendStatus(400);
    return;
  }

  let songs = currParty.songs;
  let songCopy = [];
  for (let i = 0; i < songs.length; i++) {
    // position = 2, songIdx = 0
    if (i === position) {
      if (position > songIdx) {
        songCopy.push(songs[i]);
        i++;
      }
      songCopy.push(song);
    }

    if (i == songIdx) {
    } else {
      if (i != songs.length) {
        songCopy.push(songs[i]);
      }
    }
  }

  partyCol.updateOne(
    { partyCode: parties[index].partyCode },
    { $set: { songs: songCopy } }
  );
  res.json({ songs: songCopy });
});

//**************************************************************************************** */
// SPOTIFY WEB API LOGIN AND REFRESH
//**************************************************************************************** */

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
      spotifyAccessToken = data.body.access_token;
      res.json({
        accessToken: data.body.accessToken,
        expiresIn: data.body.expiresIn,
      });
      // Save the access token so that it's used in future calls
      // spotifyApi.setAccessToken(data.body["access_token"]);
    })
    .catch((err) => {
      console.log("Could not refresh access token", err);
      res.sendStatus(400);
    });
});

app.post("/login", (req, res) => {
  const code = req.body.code;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientId: "7a561047270c440094df114ec0cbb949",
    clientSecret: "3c8f204a68fc4aa8b9a5891579a673e9",
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      spotifyAccessToken = data.body.access_token;
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

const codeGen = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$^&*";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const checkCode = async (partyCode, partiesArr) => {
  for (let i = 0; i < partiesArr.length; i++) {
    const partyObject = partiesArr[i];
    if (await bcrypt.compare(partyCode, partyObject.partyCode)) {
      return [true, i];
    }
  }
  return [false, 0];
};

const checkForUsername = async (username, usersArray) => {
  for (let i = 0; i < usersArray.length; i++) {
    const userObject = usersArray[i];
    if (await bcrypt.compare(username, userObject.username)) {
      return [true, i];
    }
  }
  return [false, 0];
};

const songIsPresent = async (partyCode, partiesArr, song) => {
  [present, index] = await checkCode(partyCode, partiesArr);
  if (!present) {
    return [false, null, -1, -1];
  }
  let currParty = partiesArr[index];
  const songsArr = currParty.songs;
  for (let i = 0; i < songsArr.length; i++) {
    if (songsArr[i] == song) {
      return [true, currParty, i, index];
    }
  }
  return [false, currParty, -1, -1];
};