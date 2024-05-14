import fs from 'fs/promises'
import readline from 'readline'
import util from 'util'
import { glob } from 'glob';
import path from 'path'
import * as tsImport from 'ts-import';

const telegramApiLibPath = "lib/telegram/api.ts"
const twitterApiLibPath = "lib/twitter.ts"

async function input(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(`${query} `, ans => {
        rl.close();
        resolve(ans);
    }))
}

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
        return false
    }
    console.log(attrs)
    const [name, series, scene, h] = attrs
    console.log(`pushing ${dirName} ...`)
    const images = await glob(`${dir}/dist/*.{png,jpeg}`)
    const covers = await glob(`${dir}/cover/*.{png,jpeg}`)
    covers.sort()
    
    const title = `${name} | ${scene}`
    const template = process.env.POST_TEMPLATE.replaceAll("\\n", "\n")
    let text = util.format(template, title, images.length, images.length)
    text = `${text}\n#${name.replaceAll(" ", "")} #${series.replaceAll(" ", "")}`
    console.log(text)
    const ans = await input("publish?")
    if (ans == 'y') {
        await pushTelegram(text, covers, h)
        await pushTwitter(text, covers, h)
        console.log(`pushed ${dirName}`)
        return true
    }
    return false
}

async function main() {
    const baseDir = process.env.BATCH_IMAGE_DIR
    const dirs = await fs.readdir(baseDir)
    dirs.sort()
    const lockFileName = "push.lock"
    for (const dirName of dirs) {
        const attrs = getAttrs(dirName)
        if (!attrs) continue
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
            break
        }
    }
}

main().then(result => console.log(result))