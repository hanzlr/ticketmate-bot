// src/commands/setup.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const { db } = require("../firebase");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup TicketMate — automatically creates all channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guild = interaction.guild;

    await interaction.editReply({
      content: "⏳ Setting up TicketMate, please wait...",
    });

    const existing = await db.collection("config").doc(guild.id).get();
    if (existing.exists) {
      return interaction.editReply({
        content:
          "❌ TicketMate has already been set up in this server! If you want to reset, run `/reset` first.",
      });
    }

    // 1. Buat kategori Tickets
    const category = await guild.channels.create({
      name: "Tickets",
      type: ChannelType.GuildCategory,
    });

    // 2. Buat channel ticket-panel (publik, locked)
    const panelChannel = await guild.channels.create({
      name: "ticket-panel",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ["SendMessages"],
          allow: ["ViewChannel"],
        },
        {
          id: interaction.client.user.id,
          allow: ["SendMessages", "ViewChannel", "EmbedLinks"],
        },
      ],
    });

    // 3. Buat channel ticket-archive (auto-private)
    const archiveChannel = await guild.channels.create({
      name: "ticket-archive",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ["ViewChannel"],
        },
        {
          id: interaction.client.user.id,
          allow: [
            "ViewChannel",
            "SendMessages",
            "EmbedLinks",
            "AttachFiles",
            "CreatePublicThreads",
            "SendMessagesInThreads",
            "ManageThreads",
            "ReadMessageHistory",
          ],
        },
      ],
    });

    // 4. Simpan ke Firebase (tanpa backupChannelId)
    await db.collection("config").doc(guild.id).set({
      categoryId: category.id,
      panelChannelId: panelChannel.id,
      archiveChannelId: archiveChannel.id,
      setupBy: interaction.user.id,
      setupAt: new Date(),
    });

    // 5. Kirim embed panel
    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Ticket")
      .setDescription(
        "Need assistance? We're here to help!\n\nClick the button below to open a support ticket.\nOur team will get back to you as soon as possible.\n\n📌 Please describe your issue clearly when the ticket opens.",
      )
      .setColor("#5865F2")
      .setFooter({ text: "TicketMate" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("📩 Open Ticket")
        .setStyle(ButtonStyle.Success),
    );

    await panelChannel.send({ embeds: [embed], components: [row] });

    return interaction.editReply({
      content:
        `✅ TicketMate has been set up successfully!\n\n` +
        `📢 Panel: ${panelChannel}\n` +
        `🔒 Archive: ${archiveChannel} *(private — auto set)*\n` +
        `📁 Category: **Tickets**`,
    });
  },
};