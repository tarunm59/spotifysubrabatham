// Schema for a party document.
// Store this in mongodb
{
  partyCode: "abcd";
  partyTime: "12:30am";
  hostUsername: "tmuralidaboss"; // username same as spotify username
  members: []; // array of user objects with username and time joined (also spotify usernames)
  songs: []; // array of song objects
  currentSong: {
  } // OPTIONAL Song object
  numberActive: 5;
}
