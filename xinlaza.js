// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as config from './config.json' with {type : "json"};
const token = config.default.token;

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

client.on('messageCreate', (message) => {
    console.log(`${message.author} said: ${message.content}`)
    if (message.content == "hello") {
        message.channel.send(`Hello, ${message.author.username}!`)
    };
});

// Log in to Discord with your client's token
client.login(token);