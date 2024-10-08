// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as config from './config.json' with {type : "json"};
import * as rawDictionary from './dictionary.json' with {type: "json"}
const token = config.default.token;
let dictionary = rawDictionary.default; //cuz js is stupid
let dictLen = dictionary.length;

let logsChannel = "1292477015571828836";
let pageLength = 50;
let role = "1293035112727838720";

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
        case "numeral":
            return "num."
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

Object.prototype.del = function(fieldKey) {
    delete this[fieldKey];
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

    let acc = "";
    let matchArr = [];
    //begin to check words. TODO: implement binary search
    for (let i = 0; i < dictLen; i++) {
        let entry = dictionary[i];
        let perfectMatch = true;
        let dictEntry = entry.xinlaza.split(" ");

        //check for perfect matches, add it to the top of acc if one is found
        if (queryArray.length === dictEntry.length) {
            for (let i = 0; i < queryArray.length; i++) {
                if (queryArray[i].toLowerCase() !== dictEntry[i].toLowerCase()) {
                    perfectMatch = false;
                    break;
                }
            }
        } else {
            perfectMatch = false;
        }
        if (perfectMatch) {
            matchArr.unshift(`**perfect match**:\n**${entry.xinlaza}** _${POS_abbrv(entry.type)}_: ${entry.translation}\n\n`);
            continue;
        }

        //check for partial matches, add 'em to acc if one is found
        let partialMatch = queryArray.length === 0 || queryArray.some((queryItem) => {
            //iterates over every word in the query and checks if it's present in the dictionary entry
            return entry.xinlaza.toLowerCase().includes(queryItem.toLowerCase());
        });
        if (partialMatch &&
            entry.xinlaza.startsWith(start) &&
            entry.xinlaza.endsWith(end) &&
            (entry.type === type || type === "")
        ) {
            matchArr.push(`**${entry.xinlaza}** _${POS_abbrv(entry.type)}_: ${entry.translation}`);
        }
    } //dictionary iterating loop end

    if (matchArr.length > 50) {
        let pageLower = pageLength * (page - 1);
        let pageUpper = pageLength * page - 1;
        acc = `-# Showing results ${pageLower + 1} to ${pageUpper + 1} out of ${matchArr.length}\n` + matchArr.slice(pageLower, pageUpper).join("\n");
    } else if (matchArr.length >= 1) {
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

    let acc = "";
    let matchArr = [];
    //dictionary search loop
    for (let i = 0; i < dictLen; i++) {
        let entry = dictionary[i];
        let entryArray = entry.translation.split(/\W+/);
        let match = false;
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

    if (matchArr.length > pageLength) {
        let pageLower = pageLength * (page - 1);
        let pageUpper = pageLength * page - 1;
        acc = `-# Showing results ${pageLower + 1} to ${pageUpper + 1}\n` + matchArr.slice(pageLower, pageUpper).join("\n");
    } else {
        acc = `-# Showing ${matchArr.length} results\n` + matchArr.join("\n");
    }

    if (acc === "") {
        return "No matches found :'c";
    }
    return acc;
}

async function send(channel, message) {
    await channel.send(message.slice(0, 2000));
    if (message.length >= 2000) {
        console.log(`Message was clipped from ${message.length} characters to avoid an application crash`);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.tag === client.user.tag) {
        return;
    }

    const content = message.content;
    const author = message.author;
    const server = author.guild;
    const channel = message.channel;
    const time = message.createdTimestamp / 1000;
    const msgURL = message.url;
    let attachments_array = Array.from(message.attachments.values());
    let attachments = "";

    for (let i = 0; i < attachments_array.length; i++) {
        attachments += `${attachments_array[i].url}\n`;
    }

    if (content.slice(0, 6) === "yo vel") {
        let command = content.split(" ");
        if (command.length >= 3) {
            let args = command.slice(3, command.length);
            switch (command[2]) {
                case 'xinlaza':
                case 'xnlz':
                case 'xlz':
                case 'xz':
                    await send(channel, xinlaza(args));
                    break;
                case 'english':
                case 'engl':
                case 'eng':
                case 'en':
                    await send(channel, english(args));
                    break;
                case 'dict':
                    await send(channel, "Sorry, this command isn't quite ready yet! How about we write some definitions?");
                    break;
                case 'help':
                    await send(channel, "Here's a memory refresher!\nYou invoke me with \`yo vel\`, if you don't write that first I won't respond. Sorry, it's just a quirk I have so I don't butt in too much!\n" +
                    "After you got my attention, here's what I can do:\n" +
                    "- \`yo vel xnlz <xz_word> [<parameters>]\`: searches for xinlaza words; accepts\n" +
                    "- \`yo vel engl <en_word> [<parameters>]\`: the same, but in English. This time, spaces matter, so that you don't search for \'run\' and get B**run**ei, yk?\n" +
                    "- \`yo vel help\`: this one invokes this reference doc that tells you every command available\n" +
                    "- \`yo vel dict <xz_word>\`: not quite ready yet! Once I update my database, you'll be able to get custom-made, native Xinlaza definitions of words instead of English translations! Exciting!!\n" +
                    "- \`yo vel code\`/\`yo vel source\`: these ones are to see my source code in GitHub.\n" +
                  /*"- \`yo vel config show\`: shows the current values of Velmeti's configurable variables\n" +
                    "- \`yo vel config setup logsChannel <channel id>/here\`: defines in what channel the message logging will take place. Saying here will take the channel of the message. It's empty by default\n" +
                    "- \`yo vel config setup pageLength <integer>\`: defines the amount of query results Velmeti can send at once. Default is 50, maximum is 100, minimum is 1.\n" +
                    "- \`yo ve config setup RESTORE\`: restore defaults.\n" +*/
                    "\`yo vel echo <message>\`: with no quotes! I'll just echo whatever you say after that." +
                    "What else can I help you with?\n");
                    break;
                case 'code':
                case 'source':
                    await send(channel, "My crib? https://github.com/Matalya/xinlaza-bot. Why? Are you visiting? 7u7");
                    break;
                /*case "config":
                    await send(channel, setup(args, message));*/
                case "echo":
                    send(channel, content.slice(11));
                    break;
                default:
                    await send(channel, "Sorry, I don't know what that means! Need a refresher? Try \'yo vel help\'!")
            }
        } else {
            await send(channel, "Yes? :eyes: If you wanna know what I can do, try \'yo vel help\' like any good CLI!");
        }
    }
    if (logsChannel !== "") {
        await send(client.channels.cache.get(logsChannel), `[<t:${Math.round(time)}:f>] in ${channel.name}; **[${author.tag}](<${msgURL}>)**: ${content}\n${attachments}`);
    }
});

// Log in to Discord with your client's token
client.login(token);