import { readFile } from "fs/promises";
import { TwitterApi, EUploadMimeType, TwitterApiTokens } from "twitter-api-v2";

let client: TwitterApi;
if (process.env.X_API_KEY != null) {
  client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET_KEY!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
  } satisfies TwitterApiTokens);
}

export const getTwitterClient = (h: boolean) => {
  if (h) {
    return new TwitterApi({
      appKey: process.env.H_X_API_KEY!,
      appSecret: process.env.H_X_API_SECRET_KEY!,
      accessToken: process.env.H_X_ACCESS_TOKEN!,
      accessSecret: process.env.H_X_ACCESS_TOKEN_SECRET!,
    } satisfies TwitterApiTokens);
  } else {
    return new TwitterApi({
      appKey: process.env.X_API_KEY!,
      appSecret: process.env.X_API_SECRET_KEY!,
      accessToken: process.env.X_ACCESS_TOKEN!,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
    } satisfies TwitterApiTokens);
  }
};

export async function postTweet(
  client: TwitterApi,
  content: string,
  images: string[]
) {
  const tasks = images.map(async (uri) => {
    let buffer: Buffer;
    if (URL.canParse(uri)) {
      const fileBlob = await fetch(new URL(uri));
      buffer = Buffer.from(await fileBlob.arrayBuffer());
    } else {
      buffer = await readFile(uri);
    }

    return client.v1.uploadMedia(buffer, { mimeType: EUploadMimeType.Png });
  });
  // First, post all your images to Twitter
  const mediaIds = await Promise.all(tasks);

  // mediaIds is a string[], can be given to .tweet
  await client.v2.tweet({
    text: content,
    media: { media_ids: mediaIds },
  });
}
