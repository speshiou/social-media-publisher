import fs from 'fs'
import {execSync} from 'child_process'
import path from 'path'
import Jimp from "jimp";
import { glob } from 'glob'

// const watermark = process.env.WATERMARK
const watermarkFont = Jimp.FONT_SANS_32_WHITE
const x = 10
const y = 10

async function findImages(dir) {
    return glob(`${dir}/*.{png,jpeg}`)
}

function getFileNamePrefix(dirName) {
    const regex = /^\d+_(.*)/;
    // Using match() to find the substring
    const match = dirName.match(regex);
    console.log(match)
    // Check if there is a match and get the result
    if (match) {
        const result = match[1];
        return `${process.env.BATCH_PREFIX}_${result}`
    } else {
        console.log("No match found");
    }

}

async function main() {
    const watermark = await Jimp.read(process.env.WATERMARK)
    const baseDir = process.env.BATCH_IMAGE_DIR
    console.log(baseDir)
    const dirs = baseDir.split("/")
    const dirName = dirs[dirs.length - 1]
    const filenamePrefix = getFileNamePrefix(dirName)
    console.log(filenamePrefix)
    const images = await findImages(process.env.BATCH_IMAGE_DIR)
    const distDir = path.join(baseDir, dirName)
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir)
    const font = await Jimp.loadFont(watermarkFont)
    for (let i = 0; i < images.length; i++) {
        const filename = images[i]
        const image = await Jimp.read(filename)
        // image.print(font, x, y, watermark)
        image.composite(watermark, 0, 0)
        const output = path.join(distDir, `${filenamePrefix}_${(i + 1).toString().padStart(3, "0")}.${image.getExtension()}`)
        image.write(output)
        console.log(output)
    }
    // zip
    while ((await findImages(distDir)).length != images.length) {
        console.log("waiting for images to be ready ...")
    }
    execSync(`zip -r ${dirName}.zip * `, {cwd: distDir})
}

main().then(result => console.log(result))