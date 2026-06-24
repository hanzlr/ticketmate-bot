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
        try {
          await interaction.editReply({
            content: '❌ An error occurred while running this command!'
          });
        } catch (e) {
          console.error('Failed to send error reply:', e.message);
        }
      }
    }

    // Handle buttons
    if (interaction.isButton()) {
      try {
        if (interaction.customId === 'open_ticket') {
          await openTicket(interaction);
        }
        if (interaction.customId === 'close_ticket') {
          await closeTicket(interaction);
        }
      } catch (error) {
        console.error('Button interaction error:', error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '❌ An error occurred!',
              ephemeral: true
            });
          } else {
            await interaction.editReply({
              content: '❌ An error occurred!'
            });
          }
        } catch (e) {
          console.error('Failed to send button error reply:', e.message);
        }
      }
    }
  }
};