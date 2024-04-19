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

export const dynamic = "force-dynamic";

const processJob = async (job: WithId<Job>) => {
  const imageTasks = job.images?.map((image) => {
    return getSignedUrl(image);
  });

  const imageUrls = await Promise.all(imageTasks || []);
  try {
    const api = new TelegramApi(process.env.TELEGRAM_BOT_API_TOKEN!);
    await api.sendMediaGroup(
      parseInt(process.env.TELEGRAM_CHAT_ID!),
      imageUrls,
      job.text
    );
  } catch (e) {
    console.log(e);
  }

  try {
    await postTweet(job.text, imageUrls);
  } catch (e) {
    console.log(e);
  }

  await updateJobStatus(job._id, "succeeded");
};

export async function GET(request: Request) {
  const job = await dispatchJob();
  if (!job) {
    return Response.json({ status: "NO_JOBS" });
  }

  await processJob(job);

  return Response.json({ status: "SUCCESS" });
}

export async function POST(request: Request) {
  // TODO: auth checking
  const formData = await request.formData();
  const content = formData.get("content");
  const images = formData.getAll("image");
  const instant = formData.get("instant");

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
        const filename = `${dateStamp()}/${randomUUID()}.png`;
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
  } satisfies Job;

  const newJobId = await createJob(newJob);
  if (instant) {
    const job = await getJobById(newJobId);
    if (job) {
      processJob(job);
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
