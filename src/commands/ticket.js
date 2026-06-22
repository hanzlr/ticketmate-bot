// src/commands/ticket.js

const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a new support ticket'),

  async execute(interaction) {
    const guildId = interaction.guildId;

    // Check if server has been set up
    const config = await db.collection('config').doc(guildId).get();
    if (!config.exists) {
      return interaction.editReply({
        content: '❌ Bot hasn\'t been set up yet! Ask an admin to run `/setup` first.'
      });
    }

    const { categoryId } = config.data();

    // Check if user already has an open ticket
    const existing = await db.collection('tickets')
      .where('guildId', '==', guildId)
      .where('userId', '==', interaction.user.id)
      .where('status', '==', 'open')
      .get();

    if (!existing.empty) {
      return interaction.editReply({
        content: '❌ You already have an open ticket!'
      });
    }

    // Create ticket channel
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: interaction.client.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'],
        }
      ]
    });

    // Save ticket to Firebase
    await db.collection('tickets').doc(channel.id).set({
      guildId,
      userId: interaction.user.id,
      username: interaction.user.username,
      channelId: channel.id,
      status: 'open',
      createdAt: new Date()
    });

    // Send message in ticket channel
    await channel.send({
      content: `👋 Hey ${interaction.user}! Your ticket has been created.\nOur support team will assist you shortly.\n\nClick the button below to close your ticket.`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              label: '🔒 Close Ticket',
              custom_id: 'close_ticket'
            }
          ]
        }
      ]
    });

    return interaction.editReply({
      content: `✅ Ticket created successfully! Head over to ${channel}`
    });
  }
};