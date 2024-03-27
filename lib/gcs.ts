'use server'

import { GenerateSignedPostPolicyV4Options, GetSignedUrlConfig, SignedPostPolicyV4Output, Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME!

export async function upload(fileName: string, blob: Blob) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    // These options will allow temporary uploading of a file
    // through an HTML form.
    const expires = Date.now() + 10 * 60 * 1000; //  10 minutes
    const options: GenerateSignedPostPolicyV4Options = {
        expires,
        fields: { 'x-goog-meta-test': 'data' },
    }

    // Get a v4 signed policy for uploading file
    const [response] = await file.generateSignedPostPolicyV4(options);
    await _upload(response, blob)
    return await getSignedUrl(fileName)
}

export async function getSignedUrl(fileName: string) {
    // These options will allow temporary read access to the file
    const options: GetSignedUrlConfig = {
        version: "v4",
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options)
    return url
}

async function _upload(policy: SignedPostPolicyV4Output, blob: Blob) {
    const formData = new FormData();
    for (const name of Object.keys(policy.fields)) {
        const value = policy.fields[name];
        formData.append(name, value)
    }
    formData.append("file", blob)
    const response = await fetch(policy.url, {
        method: 'POST',
        body: formData
    });
    console.log(`_uploaded ${response.status}`)
}