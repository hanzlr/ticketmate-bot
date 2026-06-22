// src/events/interactionCreate.js

const { openTicket, closeTicket } = require('../handlers/ticketHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await interaction.deferReply({ ephemeral: true });
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: '❌ An error occurred while running this command!'
        });
      }
    }

    // Handle buttons
    if (interaction.isButton()) {
      if (interaction.customId === 'open_ticket') {
        await openTicket(interaction);
      }
      if (interaction.customId === 'close_ticket') {
        await closeTicket(interaction);
      }
    }
  }
};