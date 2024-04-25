type JobStatus = "scheduled" | "processing" | "succeeded" | "failed";

type Job = {
  create_time: Date;
  update_time: Date;
  status: JobStatus;
  text: string;
  images?: string[];
  h: boolean | null;
};
