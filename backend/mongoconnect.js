const assert = require("assert");
require("dotenv").config();
const { MongoClient } = require("mongodb");

let dataInserted = {
  partyCode: "abcd",
  partyTime: "12:30am",
  hostUsername: "tmuralidaboss", // username same as spotify username
  members: ["tmuralidaboss", "sushmaster"], // array of user objects with username and time joined (also spotify usernames)
  songs: ["Africa", "Invisible Touch", "Easy as Rolling Off a Log"], // array of song objects
  currentSong: "Africa", // OPTIONAL Song object
  numberActive: 2,
};

let dataInserted2 = {
  partyCode: "abcde",
  partyTime: "12:30am",
  hostUsername: "tmuralidaboss", // username same as spotify username
  members: ["tmuralidaboss", "sushmaster"], // array of user objects with username and time joined (also spotify usernames)
  songs: ["Africa", "Invisible Touch", "Easy as Rolling Off a Log"], // array of song objects
  currentSong: "Africa", // OPTIONAL Song object
  numberActive: 2,
};

const dbUrl = process.env.DB_URL;

const client = new MongoClient(dbUrl);

const connection = async () => {
  await client.connect();
};

connection();

client
  .db("Partydb")
  .collection("test")
  .deleteMany();