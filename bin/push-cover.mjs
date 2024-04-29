import fs from 'fs/promises'
import { glob } from 'glob';
import path from 'path'
import * as tsImport from 'ts-import';

const telegramApiLibPath = "lib/telegram/api.ts"
const twitterApiLibPath = "lib/twitter.ts"

function getAttrs(dirName) {
    const regex = /^\d+_(.*)\((.*)\)_(.*)/;
    // Using match() to find the substring
    const match = dirName.match(regex);
    // Check if there is a match and get the result
    if (match) {
        const name = match[1];
        const series = match[2];
        let scene = match[3];
        const h = scene.includes(process.env.H_KEY)
        scene = scene.replace(`_${process.env.H_KEY}`, "")
        return [name, series, scene, h]
    } else {
        console.log("No match found");
    }
    return null
}

async function fileToBase64(filename) {
    var bitmap = await fs.readFile(filename);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
}

async function pushTelegram(text, images, h) {
    console.log(`pushing to Telegram ...`)
    const telegram = await tsImport.load(telegramApiLibPath)
    const telegramApi = new telegram.default(process.env.TELEGRAM_BOT_API_TOKEN)
    const imageTasks = images.map((filename) => {
        return fileToBase64(filename)
    })
    const chatId = parseInt(
        h ? process.env.H_TELEGRAM_CHAT_ID : process.env.TELEGRAM_CHAT_ID
    )
    console.log(`chatId: ${chatId}`)
    const base64Images = await Promise.all(imageTasks)
    await telegramApi.sendMediaGroup(chatId, base64Images, text);
}

async function pushTwitter(text, images, h) {
    console.log(`pushing to Twitter ...`)
    const twitter = await tsImport.load(twitterApiLibPath)
    const client = twitter.getTwitterClient(h)
    await twitter.postTweet(client, text, images)
}

async function push(dir) {
    const dirName = path.basename(dir)
    console.log(dirName)
    const attrs = getAttrs(dirName)
    if (!attrs) {
        return
    }
    console.log(attrs)
    const [name, series, scene, h] = attrs
    console.log(`pushing ${dirName} ...`)
    const images = await glob(`${dir}/cover/*.{png,jpeg}`)
    images.sort()
    const text = `${scene}\n#${name.replace(" ", "")} #${series.replace(" ", "")}`
    console.log(text)
    await pushTelegram(text, images, h)
    await pushTwitter(text, images, h)
    console.log(`pushed ${dirName}`)
    return true
}

async function main() {
    const baseDir = process.env.BATCH_IMAGE_DIR
    const dirs = await fs.readdir(baseDir)
    dirs.sort()
    const lockFileName = "push.lock"
    for (const dirName of dirs) {
        const absLockFile = path.join(baseDir, dirName, lockFileName)
        try {
            await fs.access(absLockFile, fs.constants.F_OK)
            console.log(`skip: ${dirName} has been pushed`)
            continue
        } catch (error) {
            const result = await push(path.join(baseDir, dirName))
            if (result) {
                await fs.writeFile(absLockFile, "")
            }
        }
        break
    }
}

main().then(result => console.log(result))