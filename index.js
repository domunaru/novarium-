require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ActivityType
} = require('discord.js');

const { QuickDB } = require('quick.db');

const db = new QuickDB();

// ==========================
// CLIENT
// ==========================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================
// PREFIX
// ==========================

const prefix = '!!';

// ==========================
// READY
// ==========================

client.once('ready', () => {

    console.log(`${client.user.tag} online!`);

    client.user.setPresence({
        activities: [
            {
                name: 'Romanium Coin',
                type: ActivityType.Watching
            }
        ],
        status: 'online'
    });
});

// ==========================
// WELCOME MEMBER
// ==========================

client.on('guildMemberAdd', async (member) => {

    const channel = member.guild.channels.cache.find(
        ch => ch.name === 'welcome'
    );

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('🎉 Member Baru!')
        .setDescription(
            `Halo ${member}, selamat datang di **${member.guild.name}**!`
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setColor('Green')
        .setTimestamp();

    channel.send({ embeds: [embed] });
});

// ==========================
// MESSAGE COMMAND
// ==========================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // AUTO RESPON
    if (message.content.toLowerCase() === 'halo') {
        return message.reply('Halo juga!');
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/);

    const command = args.shift().toLowerCase();

    // ==========================
    // PING
    // ==========================

    if (command === 'ping') {
        return message.reply('🏓 Pong!');
    }

    // ==========================
    // HALLO
    // ==========================

    if (command === 'hallo') {
        return message.reply(`Halo ${message.author.username}!`);
    }

    // ==========================
    // USER INFO
    // ==========================

    if (command === 'userinfo') {

        const embed = new EmbedBuilder()
            .setTitle('👤 User Info')
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                {
                    name: 'Username',
                    value: message.author.username,
                    inline: true
                },
                {
                    name: 'User ID',
                    value: message.author.id,
                    inline: true
                }
            )
            .setColor('Blue')
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // ==========================
    // BALANCE
    // ==========================

    if (command === 'balance') {

        let money = await db.get(`money_${message.author.id}`);
        if (!money) money = 0;

        const embed = new EmbedBuilder()
            .setTitle('💰 Romanium Coin')
            .setDescription(`Saldo kamu: **${money} RC**`)
            .setColor('Gold');

        return message.reply({ embeds: [embed] });
    }

    // ==========================
    // DAILY (FIXED 24H COOLDOWN)
    // ==========================

    if (command === 'daily') {

        const amount = 500;
        const cooldown = 24 * 60 * 60 * 1000;

        const lastDaily = await db.get(`daily_${message.author.id}`);
        const now = Date.now();

        if (lastDaily && now - lastDaily < cooldown) {

            const timeLeft = cooldown - (now - lastDaily);

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            return message.reply(
                `⏳ Kamu sudah claim daily!\nCoba lagi dalam **${hours}h ${minutes}m ${seconds}s**`
            );
        }

        await db.add(`money_${message.author.id}`, amount);
        await db.set(`daily_${message.author.id}`, now);

        return message.reply(`🎁 Kamu mendapatkan ${amount} RC dari daily!`);
    }

    // ==========================
    // WORK
    // ==========================

    if (command === 'work') {

        const amount = Math.floor(Math.random() * 500) + 100;

        await db.add(`money_${message.author.id}`, amount);

        return message.reply(`💼 Kamu bekerja dan mendapatkan ${amount} RC`);
    }

    // ==========================
    // GIVE MONEY
    // ==========================

    if (command === 'give') {

        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Tag user yang ingin dikirim uang!');
        if (!amount || amount <= 0) return message.reply('Masukkan jumlah uang!');

        let senderMoney = await db.get(`money_${message.author.id}`);

        if (!senderMoney || senderMoney < amount) {
            return message.reply('Saldo kamu tidak cukup!');
        }

        await db.subtract(`money_${message.author.id}`, amount);
        await db.add(`money_${target.id}`, amount);

        return message.reply(`✅ Berhasil mengirim ${amount} RC ke ${target}`);
    }

    // ==========================
    // CLEAR CHAT
    // ==========================

    if (command === 'clear') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Kamu tidak punya permission!');
        }

        const amount = parseInt(args[0]);

        if (!amount || amount < 1 || amount > 100) {
            return message.reply('Masukkan jumlah 1-100');
        }

        await message.channel.bulkDelete(amount, true);

        const msg = await message.channel.send(`🗑️ Berhasil menghapus ${amount} pesan`);

        setTimeout(() => {
            msg.delete().catch(() => {});
        }, 3000);
    }

    // ==========================
    // HELP
    // ==========================

    if (command === 'help') {

        const embed = new EmbedBuilder()
            .setTitle('📜 Command Bot')
            .setDescription(`
🏓 **Utility**
!!ping
!!userinfo
!!hallo
!!clear 10

💰 **Economy**
!!balance
!!daily
!!work
!!give @user 500

📌 **Other**
!!help
            `)
            .setColor('Purple');

        return message.reply({ embeds: [embed] });
    }
});

// ==========================
// LOGIN
// ==========================

client.login(process.env.TOKEN);