import {
  createJob,
  dispatchJob,
  getJobById,
  updateJobStatus,
} from "@/lib/data";
import { getSignedUrl, upload } from "@/lib/gcs";
import TelegramApi from "@/lib/telegram/api";
import { postTweet } from "@/lib/twitter";
import { dateStamp } from "@/lib/utils";
import { randomUUID } from "crypto";
import { WithId } from "mongodb";
import { TwitterApi, TwitterApiTokens } from "twitter-api-v2";

export const dynamic = "force-dynamic";

const getTwitterClient = (h: boolean) => {
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

const processJob = async (job: WithId<Job>) => {
  var results: any = {};
  const imageTasks = job.images?.map((image) => {
    return getSignedUrl(image);
  });

  const imageUrls = await Promise.all(imageTasks || []);
  try {
    const api = new TelegramApi(process.env.TELEGRAM_BOT_API_TOKEN!);
    await api.sendMediaGroup(
      parseInt(
        job.h == true
          ? process.env.H_TELEGRAM_CHAT_ID!
          : process.env.TELEGRAM_CHAT_ID!
      ),
      imageUrls,
      job.text
    );
    results["telegram"] = true;
  } catch (e) {
    results["telegram"] = false;
    console.log(e);
  }

  try {
    const client = getTwitterClient(job.h == true);
    await postTweet(client, job.text, imageUrls);
    results["twitter"] = true;
  } catch (e) {
    results["twitter"] = false;
    console.log(e);
  }

  await updateJobStatus(job._id, "succeeded");
  return results;
};

export async function GET(request: Request) {
  const job = await dispatchJob();
  if (job) {
    await processJob(job);
  }

  const jobH = await dispatchJob(true);
  if (jobH) {
    await processJob(jobH);
  }

  return Response.json({ status: "SUCCESS" });
}

export async function POST(request: Request) {
  // TODO: auth checking
  const formData = await request.formData();
  const content = formData.get("content");
  const images = formData.getAll("image");
  const instant = formData.get("instant");
  const h = formData.get("h");

  if (!content || !images) {
    return Response.json(
      { status: "error" },
      {
        // accpet
        status: 400,
      }
    );
  }

  let imageUrls: string[] = [];
  if (images) {
    for (const file of images) {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        let filename = `${dateStamp()}/${randomUUID()}.png`;
        if (h) {
          filename = `h/${filename}`;
        }
        const blob = new Blob([buffer]);
        const url = await upload(filename, blob);
        imageUrls.push(url);
      }
    }
  }

  const newJob = {
    create_time: new Date(),
    update_time: new Date(),
    status: "scheduled",
    text: content as string,
    images: imageUrls,
    h: h != null,
  } satisfies Job;

  const newJobId = await createJob(newJob);
  if (instant) {
    const job = await getJobById(newJobId);
    if (job) {
      const results = processJob(job);
      return Response.json(
        { status: "succeeded", results: results },
        {
          status: 200,
        }
      );
    }
  }

  return Response.json(
    { status: "accepted" },
    {
      // accepted
      status: 202,
    }
  );
}
