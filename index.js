import 'dotenv/config'
import WebSocket from 'ws'
import { Centrifuge } from 'centrifuge/build/protobuf'
import Bot from 'node-telegram-bot-api'

const bot = new Bot(process.env.BOT_TOKEN)

bot.on('channel_post', console.log)

async function sendTanosNotification(event) {
    const mainMsg = 'Танос активирован.'
    const eventText = JSON.stringify(event, null, 2)

    bot.sendMessage(-1002409129094, mainMsg)
    bot.sendMessage(279603779, `${eventText}`, {
        entities: [{
            type: "code",
            language: "json",
            length: eventText.length,
            offset: 0
        }]
    })
}

const token = process.env.NOT_PX_TOKEN
async function startServer() {


    const centrifuge = new Centrifuge([{
        endpoint: "wss://notpx.app/connection/websocket",
        transport: "websocket"
    }], {
        token,
        websocket: WebSocket,
    })

    centrifuge.addListener('message', console.log)

    centrifuge.on('connecting', ctx => {
        console.log(ctx)
    })

    centrifuge.on('disconnected', ctx => {
        console.log(`disconnected: ${ctx.code}, ${ctx.reason}`)
    })

    centrifuge.on('error', ctx => {
        console.log('error', ctx)
    })

    centrifuge.on('publication', ctx => {
        if (ctx.channel === 'event:message') {
            const decoded = JSON.parse(new TextDecoder().decode(ctx.data))
            for (const event of decoded) {
                if (event.type === 'Pixanos') {
                    sendTanosNotification(event)
                }
            }
        }
    })

    centrifuge.connect()
}

setInterval(function () {
    console.log("timer that keeps nodejs processing running");
}, 1000 * 60 * 60);

startServer()

