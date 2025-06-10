export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  const apiKey = process.env.GEOCODE_API_KEY;
  if (!apiKey) throw new Error("Missing GEOCODE_API_KEY");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK" && data.results.length > 0) {
    return data.results[0].formatted_address;
  } else {
    return `Lat: ${lat}, Lng: ${lng}`; // fallback
  }
}
