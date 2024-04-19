export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(request: Request) {
  return Response.json({ status: "OK" });
}

export async function POST(request: Request) {
  const event = request.headers.get("X-Patreon-Event");
  const data = await request.json();
  console.log(event, data);
  return Response.json({ status: "OK" });
}
