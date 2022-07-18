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

const users = []; //basically a database to be created
// app.use(bodyParser.urlencoded({ extended: true }));
let refreshtokenshost = [];

//**************************************************************************************** */
// TOKEN MANAGEMENT
//**************************************************************************************** */

const authenticateSpotifyUser = async (req, res, next) => {
  const spotifyAccToken = req.body.accessToken;

  if (spotifyAccToken === spotifyAccessToken) {
    next();
  } else {
    res.sendStatus(401);
  }
};

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
    const hashedUsername = await bcrypt.hash(
      hostUsername,
      await bcrypt.genSalt()
    );
    const hashedCode = await bcrypt.hash(partyCode, await bcrypt.genSalt());

    // Creating the party
    const newPartyInfo = {
      partyCode: hashedCode,
      partyTime: new Date(),
      hostUsername: hashedUsername,
      members: [hashedUsername],
      songs: [],
      currentSong: "",
      numberActive: 1,
    };
    const infoCopy = {
      partyCode: partyCode,
      partyTime: new Date(),
      hostUsername: hashedUsername,
      members: [hashedUsername],
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
      hashedUsername: hashedUsername,
    };

    const tokens = genAccess(tokenUser,hostUsername);
    const response = {
      accessToken: tokens[0],
      refreshToken: tokens[1],
      party: infoCopy,
    };

    res.json(response);
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
  let partyCode = req.body.partyCode;
  let username = req.body.username;
  // Hashing code and username
  const hashedUsername = await bcrypt.hash(username, await bcrypt.genSalt());

  let cursor = partyCol.find();
  let parties = await cursor.toArray();
  let partyCopy = parties;

  for (i in parties.length) {
    parties[i] = parties[i].partyCode;
  }

  let [exists, atIndex] = await checkCode(partyCode, parties);

  if (exists) {
    // The party exists

    // Generating refresh and access tokens for the user.
    const tokenUser = {
      partyCodeHashed: partyCopy[atIndex].partyCode,
      hashedUsername: hashedUsername,
    };
    let cursor =  secretCol.find();
    let secrets = await cursor.toArray();
    let exist = false;
    let reftoken = null;
    
    for (let secret in secrets){
      let item = secrets[secret];
      let hashname= item['username']
      
      if( await bcrypt.compare(username, hashname)){
        exist=true;
        reftoken = secrets['refreshToken'];
      }
      console.log(exist)
    }
    console.log(exist)
    if (exist==true){
      let accessToken=genOnlyAccess(username);
      const response = {
        accessToken:accessToken,
        refreshToken:reftoken,
        party: partyCopy[atIndex]
      }
      let membersArr = partyCopy[atIndex].members;
    
    // Updating the members array in mongo.
    let unameArray = membersArr;
    unameArray.push(hashedUsername);
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
      const tokens = genAccess(tokenUser,username);
  
      const response = {
      accessToken: tokens[0],
      refreshToken: tokens[1],
      party: partyCopy[atIndex],
      };
      
      let membersArr = partyCopy[atIndex].members;
      console.log(membersArr)
      

    // Updating the members array in mongo.
    let unameArray = membersArr;
    unameArray.push(hashedUsername);
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
app.delete("/hostlogout", async (req, res) => {
  const reftoken = req.body.token;
  const partyCode = req.body.partyCode;
  const userName = req.body.userName;
  let cursor = secretCol.find();
  let secrets = await cursor.toArray();
  
  for (let secret in secrets){
      item = secrets[secret];
      token = item['refreshToken'];
      console.log(token)
      if (reftoken===token)
      {
         let deleted=await secretCol.deleteOne( { "refreshToken" : reftoken } );
         if (deleted.deletedCount === 1) {

          console.log("Successfully deleted one document.");
    
        } else {
    
          console.log("No documents matched the query. Deleted 0 documents.");
    
        }
      }
    }
    
  
  //replacing the mongo parties accordingly and send back to landing page
  let partycursor = partyCol.find();
  let parties = await partycursor.toArray();
  let partyCopy = parties;

  for (i in parties.length) {
    parties[i] = parties[i].partyCode;
  }

  let [exists, atIndex] = await checkCode(partyCode, parties);

  if (exists) {
       let party = partyCopy[atIndex];
       let members1 = party['members'];
       let membersupdated = [];
       for (let member in members1){
        if(await bcrypt.compare(userName,members1[member])){
          
        }
        else{
          membersupdated.push(members1[member]);
        }
       }
    const filter = { partyCode: partyCopy[atIndex]['partyCode'] };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        members: membersupdated
      },
    };
    const result = await partyCol.updateOne(filter, updateDoc, options);
    console.log(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
    );
  }
  else{
    res.sendStatus(403);
  }
  res.sendStatus(200);
  res.redirect('/');
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
  let includebool= false;
  let refsecret = '';
  for (let secret in secrets){
      item = secrets[secret];
      token = item['refreshToken'];
      if (token==rtoken){
         includebool=true;
         refsecret=item['refreshSecret'];
      }
    }
  if (includebool==false) {
    return res.sendStatus(403);
  }
  jwt.verify(rtoken,refsecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    const accessToken = genOnlyAccess(name);
    res.json({ accessToken: accessToken });
  });
});

const genOnlyAccess = async (user) =>
{
  let secretCursor = secretCol.find();
  let accessarray = await secretCursor.toArray();
  let accessTokenSecret = crypto.randomBytes(64).toString("hex");
  for (let person in accessarray)

  {
    if(await bcrypt.compare(user,accessarray[person]['username'])){
      accessTokenSecret = accessarray[person]['accessSecret'];
    }
  }
  console.log("about to generate access token")
  const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: '900s' });
  return accessToken
}

// Creates an auth token and auth token secret for the user.
const genAccess = async (user,name) => {
  // Generating access and refresh token secrets
  const accessTokenSecret = crypto.randomBytes(64).toString("hex");
  const refreshTokenSecret = crypto.randomBytes(64).toString("hex");

  
  
  const accessToken = jwt.sign(user, accessTokenSecret, {
    expiresIn: "1800s",
  });
  const refreshToken = jwt.sign(user, refreshTokenSecret,{expiresIn:'172800s'});
  const accessSecretData = {
    partyCode: user.partyCodeHashed,
    username: user.hashedUsername,
    accessSecret: accessTokenSecret,
    refreshSecret: refreshTokenSecret,
    refreshToken:refreshToken
  };
  let cursor = secretCol.find();
  let secrets = await cursor.toArray();

  exist = false;
  for (let secret in secrets)
  {
    item = secrets[secret];
    if( await bcrypt.compare(name, item['username']))
    {
        exist=true;
    }
  }

  
  if(exist==false)
  {
    secretCol.insertOne(accessSecretData, (err, result) => {
      if (err == null) {
        console.log("Token information written");
        console.log(result);
      } else {
        console.log(err);
      }
    });
  
  }
  return [accessToken, refreshToken];
};

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
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-+?";
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
    console.log(userObject)
    if (await bcrypt.compare(username, userObject)) {
      return [true, i];
    }
  }
  return [false, 0];
};
