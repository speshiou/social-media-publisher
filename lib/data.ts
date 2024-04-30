"use server";

import { Filter, ObjectId } from "mongodb";

const DB_NAME = "social-publisher";

const myDatabase = async () => {
  // async importing mongodb package for production build
  const clientPromise = (await import("./mongodb")).default;
  const client = await clientPromise;
  return client.db(DB_NAME);
};

type DbCollection = "jobs";
type DbFields = {};

const getCollection = async <T extends DbFields>(collection: DbCollection) => {
  const db = await myDatabase();
  return db.collection<T>(collection);
};

export async function getJobById(jobId: ObjectId) {
  const jobsCollection = await getCollection<Job>("jobs");
  return jobsCollection.findOne({ _id: jobId });
}

export async function createJob(job: Job) {
  const collection = await getCollection<Job>("jobs");
  const result = await collection.insertOne(job);
  const newJobId = result.insertedId;
  return newJobId;
}

export async function dispatchJob(h: boolean = false) {
  const collection = await getCollection<Job>("jobs");
  const filter: Filter<Job> = {
    status: "scheduled",
  };

  if (h) {
    filter["h"] = true;
  } else {
    filter["$or"] = [{ h: { $exists: false } }, { h: false }];
  }
  const updatedJob = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        status: "processing",
        update_time: new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );

  return updatedJob;
}

export async function updateJobStatus(jobId: ObjectId, status: JobStatus) {
  const collection = await getCollection<Job>("jobs");
  const updatedJob = await collection.findOneAndUpdate(
    { _id: jobId },
    {
      $set: {
        status: status,
        update_time: new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );

  return updatedJob;
}
