require('dotenv').config();
const { createClient } = require('./bot/client');
const { setupBot } = require('./bot/setup');

const client = createClient();
setupBot(client);

client.login(process.env.DISCORD_TOKEN);
