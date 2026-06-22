// src/events/ready.js
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ TicketMate is online! Logged in as ${client.user.tag}`);
  }
};