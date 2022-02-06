import "https://deno.land/x/dotenv/load.ts";
import {Bot, createBot, deleteMessage, DiscordenoMessage, startBot} from "./deps.ts";
import { enableCachePlugin, enableCacheSweepers } from "./deps.ts";
import { Bitly } from "./deps.ts";

const REG_URL = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
const bitlyClinet = new Bitly(Deno.env.get("BITLY_TOKEN") ?? "")

const baseBot = createBot({
    token: Deno.env.get("BOT_TOKEN") ?? "",
    intents: ["Guilds", "GuildMessages"],
    botId: BigInt(Deno.env.get("BOT_ID") ?? ""),
    events: {
        ready() {
            console.log("Successfully connected to gateway");
        },
        async messageCreate(bot: Bot, message: DiscordenoMessage) {
            if (message.isBot)
                return

            const match = message.content.match(REG_URL)
            if (match) {
                const replaceList = new Map<string, string>()
                for (const url of match) {
                    if (!replaceList.has(url) && url.includes("amazon")) {
                        const shortUrl = await bitlyClinet.shorten(url)
                        replaceList.set(url, shortUrl)
                    }
                }
                if (replaceList.size === 0)
                    return

                let content = message.content
                replaceList.forEach(((value, key) => {
                    content = content.replaceAll(key, value)
                }))
                await deleteMessage(bot, message.channelId, message.id)
                await bot.helpers.sendMessage(message.channelId, { content })
            }
        },
    },
});

const bot = enableCachePlugin(baseBot);

enableCacheSweepers(bot);

await startBot(bot);