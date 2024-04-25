import TwitterApi, { EUploadMimeType, TwitterApiTokens } from "twitter-api-v2";

let client: TwitterApi;

if (process.env.X_API_KEY != null) {
  client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET_KEY!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
  } satisfies TwitterApiTokens);
}

export async function postTweet(
  client: TwitterApi,
  content: string,
  images: string[]
) {
  const tasks = images.map(async (imageUrl) => {
    const fileBlob = await fetch(new URL(imageUrl));

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
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
