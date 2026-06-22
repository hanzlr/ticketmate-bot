// src/commands/add.js
const { SlashCommandBuilder } = require("discord.js");
const { db } = require("../firebase");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a user to this ticket")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Select the user to add")
        .setRequired(true),
    ),

  async execute(interaction) {
    const channelId = interaction.channelId;

    // Check if this is a ticket channel
    const ticket = await db.collection("tickets").doc(channelId).get();
    if (!ticket.exists || ticket.data().status !== "open") {
      return interaction.editReply({
        content: "❌ This command can only be used inside an open ticket!",
      });
    }

    const user = interaction.options.getUser("user");

    // Prevent adding bots
    if (user.bot) {
      return interaction.editReply({
        content: "❌ You cannot add a bot to a ticket!",
      });
    }

    // Add user to channel
    await interaction.channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    // Ping user yang di-add
    await interaction.channel.send(`👋 ${user} has been added to this ticket!`);

    return interaction.editReply({
      content: `✅ ${user} has been added to this ticket!`,
    });
  },
};