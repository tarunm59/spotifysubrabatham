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

    const tokens = genAccess(tokenUser);
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
app.get("/getParty", authenticateSpotifyUser, async (req, res) => {
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
    const tokens = genAccess(tokenUser);

    const response = {
      accessToken: tokens[0],
      refreshToken: tokens[1],
      party: partyCopy[atIndex],
    };

    let membersArr = partyCode[atIndex].members;
    const hasUser = await checkForUsername(username, membersArr);
    if (hasUser) {
      res.sendStatus(403);
    }

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
  } else {
    let errorFinding = "Party Not Found!";
    console.log(errorFinding);
    res.sendStatus(400);
  }
});

// The user logs out
app.delete("/hostlogout", (req, res) => {
  const updated = refreshtokenshost.filter((el) => {
    return el !== req.body.token;
  });
  refreshtokenshost = updated;
  res.sendStatus(204);
});

// Endpoint to refresh the acces token using refresh token
app.post("/checktoken", (req, res) => {
  const rtoken = req.body.token;
  if (!rtoken) {
    return res.sendStatus(401);
  }
  if (!refreshtokenshost.includes(rtoken)) {
    return res.sendStatus(403);
  }
  jwt.verify(rtoken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    const accessToken = genAccess({ name: user.name })[0];
    res.json({ accessToken: accessToken });
  });
});

// logging into the party as a host?
app.post("/allhosts/login", async (req, res) => {
  //rplace with database.find
  const user = users.find((user) => user.name == req.body.name);
  if (!user) {
    return res.status(400).send("This Party does not exist");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      //credentials are good to go
      const jwt_access_token = genAccess(user)[0];
      const jwt_refresh_token = jwt.sign(
        user,
        process.env.REFRESH_TOKEN_SECRET
      );
      refreshtokenshost.push(jwt_refresh_token);
      res.json({
        jwt_access_token: jwt_access_token,
        jwt_refresh_token: jwt_refresh_token,
      }); //might need to remove
      res.send("Success Joining Party as Host");
    } else {
      res.send("Invalid party host credentials");
    }
  } catch {
    res.status(400).send();
  }
});

// Creates an auth token and auth token secret for the user.
const genAccess = (user) => {
  // Generating access and refresh token secrets
  const accessTokenSecret = crypto.randomBytes(64).toString("hex");
  const refreshTokenSecret = crypto.randomBytes(64).toString("hex");

  const accessSecretData = {
    partyCode: user.partyCodeHashed,
    username: user.hashedUsername,
    accessSecret: accessTokenSecret,
    refreshSecret: refreshTokenSecret,
  };

  secretCol.insertOne(accessSecretData, (err, result) => {
    if (err == null) {
      console.log("Token information written");
      console.log(result);
    } else {
      console.log(err);
    }
  });

  const accessToken = jwt.sign(user, accessTokenSecret, {
    expiresIn: "172800s",
  });
  const refreshToken = jwt.sign(user, refreshTokenSecret);
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
    const userObject = userArray[i];

    if (await bcrypt.compare(username, userObject.username)) {
      return [true, i];
    }
  }
  return [false, 0];
};
