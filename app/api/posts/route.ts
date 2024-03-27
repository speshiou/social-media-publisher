import { upload } from "@/lib/gcs";
import TelegramApi from "@/lib/telegram/api";
import { postTweet } from "@/lib/twitter";
import { dateStamp } from "@/lib/utils";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
    // TODO: auth and data checking
    const formData = await request.formData()
    const content = formData.get('content') as string
    const images = formData.getAll("image")
    let imageUrls = []
    if (images) {
        for (const file of images) {
            if (file instanceof File) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const filename =  `${dateStamp()}/${randomUUID()}.png`;
                const blob = new Blob([buffer])
                const url = await upload(filename, blob);
                imageUrls.push(url)
            }
        }
    }

    try {
        const api = new TelegramApi(process.env.TELEGRAM_BOT_API_TOKEN!)
        await api.sendMediaGroup(parseInt(process.env.TELEGRAM_CHAT_ID!), imageUrls, content)
    } catch (e) {
        console.log(e)
    }
    
    try {
        await postTweet(content, images as File[]);
    } catch (e) {
        console.log(e)
    }
    
    return Response.json({ "status": "OK" })
}