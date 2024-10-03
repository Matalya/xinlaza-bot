// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as raw_config from './config.json' with {type : "json"};
import * as raw_dictionary from './dictionary.json' with {type: "json"}
const config = raw_config.default; //cuz js is stupid
const token = config.token;
const logs_channel = config.logs_channel;
let dictionary = raw_dictionary.default; //cuz js is stupid²
// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`)
});

function POS_abbrv(string) {
    switch (string) {
        case "noun":
            return "n.";
        case "verb":
            return "v.";
        case "pronoun":
            return "pron.";
        case "adjective":
            return "adj.";
        case "adverb":
            return "adv.";
        case "suffix":
            return "suf.";
        case "prefix":
            return "pref.";
        case "expression":
            return "expr.";
        case "postposition":
            return "post.";
        case "conjunction":
            return "conj.";
        case "country":
            return "n.";
    }
    return "[unknown type]";
}

function search_xinlaza(query){
    let acc = "";
    let counter = 0;

    for (let i = 0; i < dictionary.length; i++) {
        let word = dictionary[i];
        //exact match
        if (word.xinlaza.toLowerCase() === query.toLowerCase()) {
            acc = `**exact match**:\n**${word.xinlaza}** _${POS_abbrv(word.type)}_: ${word.translation}\n\n` + acc;
            continue;
        }
        //partial match
        if (word.xinlaza.toLowerCase().includes(query.toLowerCase())) {
            counter += 1;
            acc += `**${word.xinlaza}** _${POS_abbrv(word.type)}_: ${word.translation}\n`;
        }
    }

    if (acc == "") {
        return "No matches found :'c"
    }
    return acc;
}

function search_english(query){
    let acc = "";

    for (let i = 0; i < dictionary.length; i++) {
        let word = dictionary[i];
        if (word.translation.toLowerCase().includes(` ${query.toLowerCase()} `)) {
            acc = `**${word.xinlaza}** _${POS_abbrv(word.type)}_: ${word.translation}\n` + acc;
        }
    }

    if (acc == "") {
        return "No matches found :'c"
    }
    return acc;
}

client.on('messageCreate', (message) => {
    if (message.author.tag === client.user.tag) {
        return;
    }

    let content = message.content;
    let author = message.author.tag;
    let channel = message.channelId;
    let time = message.createdTimestamp / 1000;
    let msg_url = message.url;
    let attachments_array = Array.from(message.attachments.values())
    let attachments = ""
    for (let i = 0; i < attachments_array.length; i++) {
        attachments += `${attachments_array[i].url}\n`;
    }
    client.channels.cache.get(logs_channel).send(`[<t:${Math.round(time)}:f>] in <#${channel}>; **[${author}](<${msg_url}>)**: ${content}\n${attachments}`);

    if (message.content.substring(0,6) == 'yo vel') {
        switch (message.content.substring(7,12)) {
            case 'xnlz ':
                message.channel.send(`**${message.author}**:\n${
                    search_xinlaza(
                        message.content.substring(
                            12, message.content.length
                        )
                    )
                }`)
                break;
            case 'engl ':
                message.channel.send(`**${message.author}**:\n${
                    search_english(
                        message.content.substring(
                            12, message.content.length
                        )
                    )
                }`)
            case 'dict ':
                message.channel.send("Sorry, this command isn't quite ready yet! How about we write some definitions?")
                break;
            case 'help!':
                message.channel.send("Here's a memory refresher!\nYou invoke me with \`yo vel\`, if you don't write that first I won't respond. Sorry, it's just a quirk I have so I don't butt in too much!\nAfter you got my attention, here's what I can do:\n- \`yo vel xnlz <xz_word>\`: to search for a Xinlaza word. I'll give you up to 50 words that match your query.\n- \`yo vel engl <en_word>\`: the same, but in English. This time, spaces matter, so that you don't search for \'run\' and get B**run**ei, yk?\n- \`yo vel help!\`: this one invokes this reference doc that tells you every command available\n- \`yo vel dict <xz_word>\`: not quite ready yet! Once I update my database, you'll be able to get custom-made, native Xinlaza definitions of words instead of English translations! Exciting!!\n- \`yo vel code!\`/\`yo vel srce!\`: these ones are to see my source code in GitHub.\nWhat else can I help you with?")
                break;
            case 'code':
                message.channel.send("My crib? https://github.com/Matalya/xinlaza-bot. Why? Are you visiting? 7u7");
            case 'srce!':
                message.channel.send("My crib? https://github.com/Matalya/xinlaza-bot. Why? Are you visiting? 7u7");
        };
    }
});

// Log in to Discord with your client's token
client.login(token);