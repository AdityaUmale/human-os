import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "HumanOSDecoder/1.0 (dev; contact: local)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: "Place search failed" }, { status: 502 });
    }

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: { city?: string; town?: string; state?: string; country?: string };
    }>;

    const results = data.map((item) => ({
      label: item.display_name,
      placeName:
        item.address?.city ||
        item.address?.town ||
        item.display_name.split(",")[0] ||
        item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      country: item.address?.country ?? "",
    }));

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Place search failed";
    return NextResponse.json({ results: [], error: message }, { status: 500 });
  }
}
