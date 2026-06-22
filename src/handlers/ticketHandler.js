// src/handlers/ticketHandler.js

const { db } = require("../firebase");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");

// Fetch semua pesan dengan pagination
async function fetchAllMessages(channel) {
  const allMessages = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    allMessages.push(...batch.values());
    lastId = batch.last().id;

    // Jika batch terakhir kurang dari 100, berarti sudah habis
    if (batch.size < 100) break;
  }

  return allMessages;
}

async function openTicket(interaction) {
  const guildId = interaction.guildId;

  const config = await db.collection("config").doc(guildId).get();
  if (!config.exists) {
    return interaction.reply({
      content:
        "❌ Bot hasn't been set up yet! Ask an admin to run `/setup` first.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const { categoryId } = config.data();

  if (!categoryId) {
    return interaction.reply({
      content:
        "❌ Ticket category hasn't been set up yet! Ask an admin to run `/setup` first.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const existing = await db
    .collection("tickets")
    .where("guildId", "==", guildId)
    .where("userId", "==", interaction.user.id)
    .where("status", "==", "open")
    .get();

  if (!existing.empty) {
    return interaction.reply({
      content: "❌ You already have an open ticket!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: ["ViewChannel"],
      },
      {
        id: interaction.user.id,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
      {
        id: interaction.client.user.id,
        allow: [
          "ViewChannel",
          "SendMessages",
          "ReadMessageHistory",
          "ManageChannels",
        ],
      },
    ],
  });

  await db.collection("tickets").doc(channel.id).set({
    guildId,
    userId: interaction.user.id,
    username: interaction.user.username,
    channelId: channel.id,
    status: "open",
    createdAt: new Date(),
  });

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket - ${interaction.user.username}`)
    .setDescription(
      `Hey ${interaction.user}! Your ticket has been created.\nPlease describe your issue and our team will assist you shortly.`,
    )
    .setColor("#5865F2")
    .setFooter({ text: "TicketMate" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 Close Ticket")
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({ embeds: [embed], components: [row] });

  return interaction.reply({
    content: `✅ Ticket created! Head over to ${channel}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function closeTicket(interaction) {
  const channelId = interaction.channelId;

  const ticket = await db.collection("tickets").doc(channelId).get();
  if (!ticket.exists) {
    return interaction.reply({
      content: "❌ This channel is not a ticket!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const ticketData = ticket.data();

  await db.collection("tickets").doc(channelId).update({
    status: "closed",
    closedBy: interaction.user.id,
    closedAt: new Date(),
  });

  await interaction.reply({
    content: `🔒 Ticket closed by ${interaction.user}. Saving transcript...`,
  });

  const config = await db.collection("config").doc(ticketData.guildId).get();
  const { archiveChannelId } = config.data();

  // Fetch SEMUA pesan dengan pagination
  const allMessages = await fetchAllMessages(interaction.channel);

  // Sort dari yang paling lama ke paling baru
  const sorted = allMessages.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp,
  );

  // Build transcript
  const transcript = sorted
    .filter((m) => m.content)
    .map((m) => {
      const author = m.author.bot
        ? `🤖 ${m.author.username}`
        : `👤 ${m.author.username}`;
      const content =
        m.content.replace(/<@!?(\d+)>/g, (match, id) => {
          const member = m.mentions.members?.get(id);
          return member ? `@${member.user.username}` : match;
        }) || "*[embed/attachment]*";
      const line = `${author}: ${content}`;
      return m.author.bot ? `\n${line}` : line;
    })
    .join("\n");

  const transcriptHeader =
    `📁 Ticket Transcript - ${ticketData.username}\n` +
    `Opened by: @${ticketData.username}\n` +
    `Closed by: @${interaction.user.username}\n` +
    `Total messages: ${sorted.length}\n` +
    `Date: ${new Date().toLocaleString()}\n` +
    `${"─".repeat(40)}\n\n`;

  const fullTranscript =
    transcriptHeader + (transcript || "*No messages in this ticket.*");

  const transcriptBuffer = Buffer.from(fullTranscript, "utf-8");
  const fileName = `transcript-${ticketData.username}-${Date.now()}.txt`;

  const embedTranscript = new EmbedBuilder()
    .setTitle(`📁 Ticket Transcript - ${ticketData.username}`)
    .setDescription(
      `**Opened by:** <@${ticketData.userId}>\n**Closed by:** ${interaction.user}\n**Total messages:** ${sorted.length}\n**Date:** ${new Date().toLocaleString()}`,
    )
    .setColor("#5865F2")
    .setFooter({ text: "TicketMate" });

  // Kirim ke ticket-archive sebagai thread
  if (archiveChannelId) {
    try {
      const archiveChannel =
        await interaction.guild.channels.fetch(archiveChannelId);

      const thread = await archiveChannel.threads.create({
        name: `ticket-${ticketData.username} - ${new Date().toLocaleDateString()}`,
        autoArchiveDuration: 1440,
      });

      await thread.send({
        embeds: [embedTranscript],
        files: [new AttachmentBuilder(transcriptBuffer, { name: fileName })],
      });
    } catch (e) {
      console.error("Failed to send to archive channel:", e.message);
    }
  }

  // Hapus channel setelah 5 detik
  setTimeout(async () => {
    await interaction.channel.delete();
  }, 5000);
}

module.exports = { openTicket, closeTicket };
