// src/commands/reset.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reset TicketMate configuration for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guildId;

    // Cek apakah sudah di-setup
    const config = await db.collection('config').doc(guildId).get();
    if (!config.exists) {
      return interaction.editReply({
        content: '❌ TicketMate hasn\'t been set up in this server yet!'
      });
    }

    // Hapus config dari Firebase
    await db.collection('config').doc(guildId).delete();

    return interaction.editReply({
      content: '✅ TicketMate has been reset!\n\nRun `/setup` to set up again.\n\n⚠️ **Note:** Old ticket channels and categories are not deleted automatically. Please remove them manually if needed.'
    });
  }
};