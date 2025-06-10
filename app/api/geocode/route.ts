// app/api/geocode/route.ts
export async function POST(req: Request) {
  const { lat, lng } = await req.json();
  const apiKey = process.env.GEOCODE_API_KEY;

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  const address = data?.results?.[0]?.formatted ?? `${lat}, ${lng}`;

  return Response.json({ address });
}

