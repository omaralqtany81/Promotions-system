// ============================================
// Discord Presence Bot - يخلي البوت أونلاين
// شغّله على Railway.app أو أي سيرفر Node.js
// ============================================

const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const BOT_TOKEN = 'MTQ4MDM4MTk1MTM1MjUwNDM3MQ.GACeRh.KJ-psKfWVHnfZ_5rQaEU24GsUUA2_7azQnn7-w';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ]
});

client.on('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  
  // Set status
  client.user.setPresence({
    activities: [{ 
      name: 'نظام الترقيات',
      type: ActivityType.Watching 
    }],
    status: 'online', // online, idle, dnd
  });
});

client.login(BOT_TOKEN);
