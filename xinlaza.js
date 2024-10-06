// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as raw_config from './config.json' with {type : "json"};
import * as raw_dictionary from './dictionary.json' with {type: "json"}
const config = raw_config.default; //cuz js is stupid
const token = config.token;
const logs_channel = config.logs_channel;
const xinlaza_esan = config.xinlaza_only;
const PAGE_LENGTH = config.PAGE_LENGTH;
let dictionary = raw_dictionary.default; //cuz js is stupid²
let dictLen = dictionary.length;
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
	console.log(`${readyClient.user.tag}, verkdes`);
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
String.prototype.startsWith = function (substring) {
    if (substring.length > this.length) {
        return false;
    }

   return this.slice(0, substring.length) === substring;
}

String.prototype.endsWith = function (substring) {
    if (substring.length > this.length) {
        return false;
    }

    return this.slice(this.length - substring.length, this.length) === substring;
}

Array.prototype.joinIntoStr = function (separator = " ", maxLength = this.length) {
    return this.slice(0, maxLength).map(item => String(item)).join(separator);
}

function xinlaza(args){
    //parse the arguments
    let type = "";
    let start = "";
    let end = "";
    let page = 1;
    let queryArray = [];
    for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        let argEnd = arg.length;
        if (arg.startsWith("type:")) {
            type = arg.slice(5, argEnd);
        } else
        if (arg.startsWith("start:")) {
            start = arg.slice(6, argEnd);
        } else
        if (arg.startsWith("end:")) {
            end = arg.slice(4, argEnd);
        } else
        if (arg.startsWith("page:")) {
            page = Number(arg.slice(5, argEnd));
        } else {
            queryArray.push(arg);
        }
    }
    if (queryArray.length === 0) {
        queryArray.push(start);
    }

    let acc = "";
    let matchArr = [];
    //begin to check words. TODO: implement binary search
    for (let i = 0; i < dictLen; i++) {
        let entry = dictionary[i];
        let perfect_match = true;
        let dictEntry = entry.xinlaza.split(" ");

        //check for perfect matches, add it to the top of acc if one is found
        if (queryArray.length === dictEntry.length) {
            for (let i = 0; i < queryArray.length; i++) {
                if (queryArray[i].toLowerCase() !== dictEntry[i].toLowerCase()) {
                    perfect_match = false;
                    break;
                }
            }
        } else {
            perfect_match = false;
        }
        if (perfect_match) {
            matchArr.unshift(`**perfect match**:\n**${entry.xinlaza}** _${POS_abbrv(entry.type)}_: ${entry.translation}\n\n`);
            continue;
        }

        //check for partial matches, add 'em to acc if one is found
        let partial_match = queryArray.some((queryItem) => {
            //iterates over every word in the query and checks if it's present in the dictionary entry
            return entry.xinlaza.toLowerCase().includes(queryItem.toLowerCase());
        });
        if (partial_match &&
            entry.xinlaza.startsWith(start) &&
            entry.xinlaza.endsWith(end) &&
            (entry.type === type || type === "")
        ) {
            matchArr.push(`**${entry.xinlaza}** _${POS_abbrv(entry.type)}_: ${entry.translation}`);
        }
    } //dictionary iterating loop end

    if (matchArr.length > 50) {
        let page_lower = PAGE_LENGTH * (page - 1);
        let page_upper = PAGE_LENGTH * page - 1;
        acc = `-# Showing results ${page_lower + 1} to ${page_upper + 1} out of ${matchArr.length}\n` + matchArr.slice(page_lower, page_upper).join("\n");
    } else if (matchArr.length === 1) {
        acc = `-# Showing ${matchArr.length} result${matchArr > 1 ? "s" : ""}\n` + matchArr.join("\n");
    } else {
        return "No matches found :'c";
    }
    return acc;
}

function english(args){
    let type = "";
    let page = 1;
    let queryArray = [];
    for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        let argEnd = arg.length;
        if (arg.startsWith("type:")) {
            type = arg.slice(5, argEnd)
        } else
        if (arg.startsWith("page:")) {
            page = Number(arg.slice(5, argEnd));
        } else {
            queryArray.push(arg);
        }
    }

    //dictionary search loop
    let acc = "";
    let matchArr = [];
    for (let i = 0; i < dictLen; i++) {
        let entry = dictionary[i];
        let entryArray = entry.translation.split(/\W+/);
        let match = false;
        let matchArr = [];
        if (type === entry.type || type === "") {
            if (queryArray.length === 0) {
                match = true;
            } else {
                for (let q = 0; q < queryArray.length; q++) {
                    for (let e = 0; e < entryArray.length; e++) {
                        if (entryArray[e].toLowerCase() === queryArray[q].toLowerCase()) {
                            match = true;
                        }
                    }
                }
            }
        }
        if (match) {
            matchArr.push(`**${entry.xinlaza}** _${POS_abbrv(entry.type)}_: ${entry.translation}`);
        }
    }//dictionary search loop end

    if (matchArr.length > 50) {
        let page_lower = PAGE_LENGTH * (page - 1);
        let page_upper = PAGE_LENGTH * page;
        acc = `-# Showing results ${pager_lower + 1} to ${page_upper + 1}\n` + matchArr.slice(page_lower, page_upper).join("\n");
    } else {
        acc = `-# Showing ${matchArr.length} results\n` + matchArr.join("\n");
    }

    if (acc === "") {
        return "No matches found :'c";
    }
    return acc;
}

function send(channel, message) {
    channel.send(message.slice(0, 2000))
    if (message.length >= 2000) {
        console.log(`Message was clipped from ${message.length} characters to avoid an application crash`);
    }
}

client.on('messageCreate', (message) => {
if (message.author.tag === client.user.tag) {
    return;
}

let content = message.content;
let author = message.author;
let channel = message.channel;
let time = message.createdTimestamp / 1000;
let msg_url = message.url;
let attachments_array = Array.from(message.attachments.values());
let attachments = "";

for (let i = 0; i < attachments_array.length; i++) {
    attachments += `${attachments_array[i].url}\n`;
}
send(client.channels.cache.get(logs_channel), `[<t:${Math.round(time)}:f>] in ${channel.name}; **[${author.tag}](<${msg_url}>)**: ${content}\n${attachments}`);

if (content.slice(0, 6) === "yo vel") {
    if (channel.id === xinlaza_esan) {
        send(channel, "Sorry, can't answer that here!")
        return;
    }
    let command = content.split(" ");
    if (command.length >= 3) {
        let args = command.slice(3, command.length);
        switch (command[2]) {
            case 'xinlaza':
            case 'xnlz':
            case 'xlz':
            case 'xz':
                send(channel, xinlaza(args));
                break;
            case 'english':
            case 'engl':
            case 'eng':
            case 'en':
                send(channel, english(args));
                break;
            case 'dict':
                send(channel, "Sorry, this command isn't quite ready yet! How about we write some definitions?");
                break;
            case 'help':
                send(channel, "Here's a memory refresher!\nYou invoke me with \`yo vel\`, if you don't write that first I won't respond. Sorry, it's just a quirk I have so I don't butt in too much!\nAfter you got my attention, here's what I can do:\n- \`yo vel xnlz <xz_word> [<parameters>]\`: searches for xinlaza words; accepts\n- \`yo vel engl <en_word>\`: the same, but in English. This time, spaces matter, so that you don't search for \'run\' and get B**run**ei, yk?\n- \`yo vel help!\`: this one invokes this reference doc that tells you every command available\n- \`yo vel dict <xz_word>\`: not quite ready yet! Once I update my database, you'll be able to get custom-made, native Xinlaza definitions of words instead of English translations! Exciting!!\n- \`yo vel code!\`/\`yo vel srce!\`: these ones are to see my source code in GitHub.\nWhat else can I help you with?");
                break;
            case 'code':
            case 'source':
                send(channel, "My crib? https://github.com/Matalya/xinlaza-bot. Why? Are you visiting? 7u7");
        }
    } else {
        send(channel, "Yes? :eyes:");
    }
}

})

// Log in to Discord with your client's token
client.login(token);