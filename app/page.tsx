import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form method="POST" action="/api/posts" encType="multipart/form-data">
        <input type="file" name="image" multiple />
        <button>Submit</button>
      </form>
    </main>
  );
}
