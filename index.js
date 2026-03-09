const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const BOT_TOKEN = 'MTQ4MDM4MTk1MTM1MjUwNDM3MQ.G0146R.Psex6wPIgzTWKU0fLSWvOLtnO9YrPp4Teapzz0';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ]
});

client.on('ready', () => {
  console.log('Bot online: ' + client.user.tag);
  client.user.setPresence({
    activities: [{ name: 'Promotions System', type: ActivityType.Watching }],
    status: 'online',
  });
});

client.login(BOT_TOKEN);
