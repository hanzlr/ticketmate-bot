// src/commands/help.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 TicketMate - Help')
      .setDescription('Here are all available commands:')
      .setColor('#5865F2')
      .addFields(
        {
          name: '⚙️ Admin Setup',
          value: '`/setup` — Automatically set up TicketMate (creates category, panel, and archive channel)'
        },
        {
          name: '👥 User Management',
          value: '`/add @user` — Add a user to the current ticket\n`/remove @user` — Remove a user from the current ticket'
        },
        {
          name: '❓ General',
          value: '`/help` — Show this help message'
        }
      )
      .setFooter({ text: 'TicketMate' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};