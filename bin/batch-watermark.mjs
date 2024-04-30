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
    const images = await glob(`${dir}/*.{png,jpeg}`)
    images.sort()
    return images
}

function getAttrs(dirName) {
    const regex = /^(\d+)_(.*)\(.*\)_(.*)/;
    // Using match() to find the substring
    const match = dirName.match(regex);
    // Check if there is a match and get the result
    if (match) {
        const date = match[1];
        const name = match[2];
        let scene = match[3];
        const h = scene.includes(process.env.H_KEY)
        scene = scene.replace(`_${process.env.H_KEY}`, "")
        return [date, name, scene]
    } else {
        console.log("No match found");
    }
    return null
}

function pickCovers(files, count) {
    const results = new Set();
    const n = Math.min(count, files.length)
    while (results.size < n) {
        const index = Math.floor(Math.random() * files.length);
        results.add(files[index]);
    }
    return Array.from(results);
}

async function distAlbum(baseDir, watermark) {
    console.log(`found ${baseDir}`)
    const dirs = baseDir.split("/")
    const dirName = dirs[dirs.length - 1]
    const attrs = getAttrs(dirName)
    if (!attrs) {
        console.log(`${dirName} is not a valid album`)
        return
    }
    const [date, name, scene] = attrs
    const key = `${date}_${name}_${scene}_by_${process.env.BATCH_PREFIX}`
    const filenamePrefix = `${name}_${scene}_by_${process.env.BATCH_PREFIX}`
    const zipFileName = `${key}.zip`
    const distDir = path.join(baseDir, "dist")
    const absZipPath = path.join(distDir, zipFileName)
    const coverDir = path.join(baseDir, "cover")
    if (fs.existsSync(absZipPath)) {
        console.log(`${zipFileName} already exists`)
        return
    }
    const images = await findImages(baseDir)
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir)
    fs.rmSync(coverDir, { recursive: true, force: true });
    fs.mkdirSync(coverDir)
    const font = await Jimp.loadFont(watermarkFont)
    let markedImages = []
    for (let i = 0; i < images.length; i++) {
        const filename = images[i]
        const image = await Jimp.read(filename)
        // image.print(font, x, y, watermark)
        image.composite(watermark, 0, 0)
        const output = path.join(distDir, `${filenamePrefix}_${(i + 1).toString().padStart(3, "0")}.${image.getExtension()}`)
        image.write(output)
        console.log(output)
        markedImages.push(output)
    }
    // zip
    while ((await findImages(distDir)).length != images.length) {
        console.log("waiting for images to be ready ...")
    }
    execSync(`zip -r ${zipFileName} * `, {cwd: distDir})
    console.log(`created ${zipFileName}`)
    // covers
    const covers = pickCovers(markedImages, 4)
    for (const cover of covers) {
        const target = path.join(coverDir, path.basename(cover))
        fs.copyFileSync(cover, target);
    }
    console.log(`generated cover images`)
}

async function main() {
    const watermark = await Jimp.read(process.env.WATERMARK)
    const baseDir = process.env.BATCH_IMAGE_DIR
    const dirs = fs.readdirSync(baseDir)
    for (const dir of dirs) {
        await distAlbum(path.join(baseDir, dir), watermark)
    }
}

main().then(result => console.log(result))