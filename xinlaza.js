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

function type(string) {
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
        if (word.xinlaza.toLowerCase() === query.toLowerCase()) {
            acc = `**exact match**:\n**${word.xinlaza}** _${type(word.type)}_: ${word.translation}\n\n` + acc;
            continue;
        }
        if (word.xinlaza.toLowerCase().includes(query.toLowerCase())) {
            counter += 1;
            acc += `**${word.xinlaza}** _${type(word.type)}_: ${word.translation}\n`;
        }
    }
    if (acc == "") {
        return "No matches found :'c"
    }
    return acc;
}

function search_english(query){

}

client.on('messageCreate', (message) => {
    if (message.author.tag === client.user.tag) {
        return;
    }
    let msg = message.content
    client.channels.cache.get(logs_channel).send(`[<t:${Math.round(message.createdTimestamp/1000)}:f>] in <#${message.channelId}>; **[${message.author.tag}](<${message.url}>)**: ${msg}`)

    if (message.content.substring(0,7) == 'yo vel ') {
        switch (message.content.substring(7,12)) {
            case 'xnlz ':
                message.channel.send(`I got the query: \`${message.content.substring(12, message.content.length)}\``);
                message.channel.send(`**${message.author}**:\n${search_xinlaza(message.content.substring(12, message.content.length))}`)
                .then(message => console.log(`Sent message: ${message.content}`))
                .catch(console.error);
                break;
            case 'engl ':
                break;
        };
    }
});

// Log in to Discord with your client's token
client.login(token);