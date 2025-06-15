// app/api/geocode/route.ts
export async function POST(req: Request) {
  const { lat, lng } = await req.json();
  const apiKey = process.env.GEOCODE_API_KEY;
  if (!apiKey) {
    console.error("Missing GEOCODE_API_KEY environment variable");
    return Response.json({ address: "Unknown location" }, { status: 500 });
  }

  try {
    // Use OpenCage API for geocoding
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&pretty=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenCage API error: ${response.status} ${response.statusText}`);
      return Response.json({ address: "Unknown location" }, { status: 500 });
    }
    
    const data = await response.json();
    
    // Extract the formatted address from the response
    if (data.results && data.results.length > 0 && data.results[0].formatted) {
      return Response.json({ address: data.results[0].formatted });
    } else {
      console.warn("No results returned from OpenCage API", { lat, lng });
      return Response.json({ address: `Location: ${lat}, ${lng}` });
    }
  } catch (error) {
    console.error("Error fetching location from OpenCage:", error);
    return Response.json({ address: "Unknown location" }, { status: 500 });
  }
}

