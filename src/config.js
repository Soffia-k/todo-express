require('dotenv').config();

const required = ['OWNER_LOGIN', 'OWNER_FULL_NAME', 'API_TOKEN'];
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing env: ${k}`);
}

module.exports = {
  ownerLogin: process.env.OWNER_LOGIN,
  ownerFullName: process.env.OWNER_FULL_NAME,
  apiToken: process.env.API_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
};