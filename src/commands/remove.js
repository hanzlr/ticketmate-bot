// src/commands/remove.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from this ticket')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Select the user to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    const channelId = interaction.channelId;

    // Check if this is a ticket channel
    const ticket = await db.collection('tickets').doc(channelId).get();
    if (!ticket.exists || ticket.data().status !== 'open') {
      return interaction.editReply({
        content: '❌ This command can only be used inside an open ticket!'
      });
    }

    const ticketData = ticket.data();
    const user = interaction.options.getUser('user');

    // Prevent removing bots
    if (user.bot) {
      return interaction.editReply({
        content: '❌ You cannot remove a bot from a ticket!'
      });
    }

    // Prevent removing the ticket owner
    if (user.id === ticketData.userId) {
      return interaction.editReply({
        content: '❌ You cannot remove the ticket owner!'
      });
    }

    // Prevent removing admins
    const member = await interaction.guild.members.fetch(user.id);
    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.editReply({
        content: '❌ You cannot remove an admin from a ticket!'
      });
    }

    // Remove user from channel
    await interaction.channel.permissionOverwrites.delete(user);

    return interaction.editReply({
      content: `✅ ${user} has been removed from this ticket!`
    });
  }
};