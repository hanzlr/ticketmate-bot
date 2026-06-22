// src/events/channelDelete.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const { db } = require("../firebase");

module.exports = {
  name: "channelDelete",
  async execute(channel, client) {
    const config = await db.collection("config").doc(channel.guildId).get();
    if (!config.exists) return;

    const { panelChannelId, archiveChannelId, categoryId } = config.data();

    // ─── Recreate ticket-panel jika dihapus ───
    if (channel.id === panelChannelId) {
      const newPanelChannel = await channel.guild.channels.create({
        name: "ticket-panel",
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: channel.guild.id,
            deny: ["SendMessages"],
            allow: ["ViewChannel"],
          },
          {
            id: client.user.id,
            allow: ["SendMessages", "ViewChannel", "EmbedLinks"],
          },
        ],
      });

      await db.collection("config").doc(channel.guildId).update({
        panelChannelId: newPanelChannel.id,
      });

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

      await newPanelChannel.send({ embeds: [embed], components: [row] });
      console.log(`✅ ticket-panel recreated in ${channel.guild.name}`);
    }

    // ─── Recreate ticket-archive jika dihapus ───
    if (channel.id === archiveChannelId) {
      const newArchiveChannel = await channel.guild.channels.create({
        name: "ticket-archive",
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: channel.guild.id,
            deny: ["ViewChannel"],
          },
          {
            id: client.user.id,
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

      await db.collection("config").doc(channel.guildId).update({
        archiveChannelId: newArchiveChannel.id,
      });

      console.log(`✅ ticket-archive recreated in ${channel.guild.name}`);
    }
  },
};