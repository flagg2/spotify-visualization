import { NextResponse } from "next/server";
import { z } from "zod";

const spotifySearchSchema = z.object({
  artistName: z.string(),
  country: z.string().optional(),
  trackIds: z.string().optional(), // Comma-separated list of track IDs
});

// This function gets an access token from Spotify
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify API credentials are not set in .env.local");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(clientId + ":" + clientSecret).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store", // Important for Next.js fetch caching
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to get Spotify access token:", errorBody);
    throw new Error(
      `Failed to get Spotify access token: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parseResult = spotifySearchSchema.safeParse(rawParams);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid artistName parameter" },
      { status: 400 }
    );
  }

  const { artistName, country, trackIds } = parseResult.data;

  try {
    const accessToken = await getSpotifyAccessToken();

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        artistName
      )}&type=artist&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorBody = await searchResponse.text();
      console.error("Failed to search for artist on Spotify:", errorBody);
      throw new Error(
        `Failed to search for artist on Spotify: ${searchResponse.statusText}`
      );
    }

    const searchData = await searchResponse.json();
    const artist = searchData.artists.items[0];

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // --- Fetch Album Covers for Specific Tracks ---
    let trackCovers = {};
    if (trackIds) {
      const severalTracksResponse = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${trackIds}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (severalTracksResponse.ok) {
        const severalTracksData = await severalTracksResponse.json();
        trackCovers = severalTracksData.tracks.reduce(
          (acc: any, track: any) => {
            if (track && track.album && track.album.images.length > 0) {
              acc[track.id] = track.album.images[0].url;
            }
            return acc;
          },
          {}
        );
      } else {
        console.error("Failed to fetch several tracks from Spotify");
      }
    }

    // --- Combine and Return Data ---
    const artistDetails = {
      image: artist.images[0]?.url || null,
      spotifyUrl: artist.external_urls.spotify,
      followers: artist.followers.total,
      genres: artist.genres,
      trackCovers,
    };

    return NextResponse.json(artistDetails);
  } catch (error) {
    console.error("[SPOTIFY_API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
