import TwitterApi, { TwitterApiTokens } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.X_API_KEY || "",
    appSecret: process.env.X_API_SECRET_KEY || "",
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
} satisfies TwitterApiTokens);
  

export async function postTweet(content: string, images: File[]) {
    const tasks = images.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        return client.v1.uploadMedia(buffer, { type: 'png' });
    })
  // First, post all your images to Twitter
  const mediaIds = await Promise.all(tasks);
  
  // mediaIds is a string[], can be given to .tweet
  await client.v2.tweet({
    text: content,
    media: { media_ids: mediaIds }
  });
}