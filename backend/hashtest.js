const bcrypt = require("bcrypt");
const hostUsername = "sushant";
const partyCode = "AAAAAA";

const check = async () => {
  const usernameSalt = await bcrypt.genSalt();
  const hashedUsername = await bcrypt.hash(hostUsername, usernameSalt);

  const codeSalt = await bcrypt.genSalt();
  const hashedCode = await bcrypt.hash(partyCode, codeSalt);
  const hello = await bcrypt.compare(hostUsername, hashedUsername);
  console.log(hello);
};

check();
