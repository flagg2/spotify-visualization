"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// A fetcher function that calls our new API route
const fetchSpotifyData = async (
  artistName: string,
  country: string,
  trackIds: string,
) => {
  if (!artistName) {
    throw new Error("Artist name cannot be empty");
  }
  const response = await fetch(
    `/api/spotify?artistName=${encodeURIComponent(
      artistName,
    )}&country=${country}&trackIds=${trackIds}`,
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

interface ArtistData {
  name: string;
  rank: number;
  rankSK?: number | null;
  rankCZ?: number | null;
  avgTop50Count?: number;
  maxSongsAcrossBothCountries?: number;
  country: string;
  stats: {
    tracksInDataset: number;
    avgTempo: number;
    avgDuration: string;
    collabRatio: number;
  };
  top50History: any[]; // Define more specific type if needed
  audioProfile: any[]; // Define more specific type if needed
  tracks: {
    id: string;
    title: string;
    artists: string;
    rank: number;
    popularity: number;
    duration: string;
    days_in_top_50: number;
    isTopTrack: boolean;
    cover?: string | null;
  }[];
}

interface ArtistSidePanelProps {
  artistData: ArtistData | null;
  selectedCountry?: "SK" | "CZ";
  artistName?: string | null;
}

export function ArtistSidePanel({
  artistData,
  selectedCountry = "SK",
  artistName = null,
}: ArtistSidePanelProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // Reset loaded images when country or artist changes
  useEffect(() => {
    setLoadedImages({});
  }, [selectedCountry, artistData?.name]);

  const {
    data: spotifyData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["spotifyArtist", artistData?.name, selectedCountry],
    queryFn: () => {
      const top5TrackIds = artistData!.tracks
        .slice(0, 5)
        .map((t) => t.id)
        .join(",");
      return fetchSpotifyData(artistData!.name, selectedCountry, top5TrackIds);
    },
    enabled: !!artistData, // Only run the query if artistData is available
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes (reduced from 1 hour)
  });

  if (!artistData) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Artist Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {artistName ? (
              <p>
                This artist has not appeared in the top 50 charts for this
                country
              </p>
            ) : (
              <p>Select an artist to see their details</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate the max value for the left Y-axis of the history chart
  // Use the max across both countries to keep scale consistent
  const maxSongsInTop50 = artistData.maxSongsAcrossBothCountries || 0;
  const yAxisMax = Math.max(10, maxSongsInTop50 + 2);

  // Transform top50History to show 51 for months with no ranking
  const transformedTop50History = artistData.top50History.map((item: any) => ({
    ...item,
    bestRankInMonth: item.bestRankInMonth === null ? 51 : item.bestRankInMonth,
  }));

  const mergedArtistData = {
    ...artistData,
    image: spotifyData?.image,
    spotifyUrl: spotifyData?.spotifyUrl,
    genres: spotifyData?.genres,
    tracks: artistData.tracks.map((track) => ({
      ...track,
      cover: spotifyData?.trackCovers?.[track.id] || null,
    })),
  };

  console.log("Merged Artist Data:", mergedArtistData);

  return (
    <Card className="flex-1 overflow-y-auto">
      <CardHeader>
        <div className="flex items-start gap-4">
          {isLoading ? (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <img
              src={mergedArtistData.image || "/placeholder.svg"}
              alt={mergedArtistData.name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold mb-2 text-balance">
              {mergedArtistData.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedCountry === "SK" && mergedArtistData.rankSK && (
                <Badge variant="default" className="text-sm font-semibold">
                  #{mergedArtistData.rankSK} in SK
                </Badge>
              )}
              {selectedCountry === "CZ" && mergedArtistData.rankCZ && (
                <Badge variant="default" className="text-sm font-semibold">
                  #{mergedArtistData.rankCZ} in CZ
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {mergedArtistData.country}
              </Badge>
              {mergedArtistData.genres?.slice(0, 2).map((genre: string) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="text-xs capitalize"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            asChild
            className="flex-1"
            disabled={!mergedArtistData.spotifyUrl}
          >
            <a
              href={mergedArtistData.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Play on Spotify
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            asChild
            disabled={!mergedArtistData.spotifyUrl}
          >
            <a
              href={mergedArtistData.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">View on Spotify</span>
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats Row */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="text-2xl font-bold">
                {mergedArtistData.stats.tracksInDataset}
              </div>
              <div className="text-xs text-muted-foreground">
                Tracks in top 50
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold">
                {mergedArtistData.stats.avgTempo} BPM
              </div>
              <div className="text-xs text-muted-foreground">Avg tempo</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold">
                {mergedArtistData.stats.avgDuration}
              </div>
              <div className="text-xs text-muted-foreground">Avg duration</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold">
                {mergedArtistData.stats.collabRatio}%
              </div>
              <div className="text-xs text-muted-foreground">Collab ratio</div>
            </Card>
          </div>
        </div>

        {/* Songs in Top 50 Chart */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Songs in Top 50
          </h3>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs mb-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">Count over time</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={mergedArtistData.top50History} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                  label={{
                    value: "Time",
                    position: "bottom",
                    offset: 5,
                    style: {
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    },
                  }}
                  ticks={mergedArtistData.top50History
                    .filter((d: any) => d.isYearStart)
                    .map((d: any) => d.date)}
                  tickFormatter={(value) => {
                    const item = mergedArtistData.top50History.find(
                      (d: any) => d.date === value,
                    );
                    return item?.displayDate.split(" ")[1] || value;
                  }}
                />
                <YAxis
                  className="text-xs"
                  domain={[0, yAxisMax]}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                  label={{
                    value: "Songs",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    },
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                          <p className="text-xs font-semibold mb-1">
                            {data.displayDate}
                          </p>
                          <p className="text-xs">Songs: {data.top50Count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="top50Count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Best Rank Chart */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Best Rank
          </h3>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs mb-2">
              <div className="w-3 h-0.5 bg-orange-500" />
              <span className="text-muted-foreground">Monthly best rank</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={transformedTop50History} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                  label={{
                    value: "Time",
                    position: "bottom",
                    offset: 5,
                    style: {
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    },
                  }}
                  ticks={transformedTop50History
                    .filter((d: any) => d.isYearStart)
                    .map((d: any) => d.date)}
                  tickFormatter={(value) => {
                    const item = transformedTop50History.find(
                      (d: any) => d.date === value,
                    );
                    return item?.displayDate.split(" ")[1] || value;
                  }}
                />
                <YAxis
                  reversed
                  type="number"
                  domain={[1, 51]}
                  ticks={[1, 10, 20, 30, 40, 50, 51]}
                  className="text-xs"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                  label={{
                    value: "Rank",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    },
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                          <p className="text-xs font-semibold mb-1">
                            {data.displayDate}
                          </p>
                          <p className="text-xs">
                            Best Rank:{" "}
                            {data.bestRankInMonth === 51
                              ? "Not in Top 50"
                              : `#${data.bestRankInMonth}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bestRankInMonth"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Audio Fingerprint Radar Chart */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Audio Fingerprint
          </h3>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={mergedArtistData.audioProfile}
                margin={{ top: 20 }}
              >
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis
                  dataKey="attribute"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  style={{ fontSize: 10 }}
                />
                <Radar
                  name="Audio Profile"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Key Tracks List */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Popular Tracks
          </h3>
          <div className="space-y-2">
            {mergedArtistData.tracks.slice(0, 5).map((track) => {
              // Use a unique key per country to force image reloading
              const imageKey = `${track.id}-${selectedCountry}`;
              const imageLoaded = loadedImages[imageKey] ?? false;
              return (
                <Card
                  key={track.id}
                  className={`p-3 transition-colors hover:bg-accent ${
                    track.isTopTrack ? "border-primary bg-accent/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {track.cover ? (
                      <div className="relative">
                        <img
                          src={track.cover}
                          alt={track.title}
                          key={imageKey}
                          onLoad={() =>
                            setLoadedImages((prev) => ({
                              ...prev,
                              [imageKey]: true,
                            }))
                          }
                          className={`rounded object-cover flex-shrink-0 bg-muted ${
                            track.isTopTrack ? "w-16 h-16" : "w-12 h-12"
                          }`}
                        />
                        {!imageLoaded && (
                          <div className="absolute inset-0 rounded bg-muted flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`rounded bg-muted flex-shrink-0 ${
                          track.isTopTrack ? "w-16 h-16" : "w-12 h-12"
                        }`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold truncate ${
                          track.isTopTrack ? "text-base" : "text-sm"
                        }`}
                      >
                        {track.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {track.artists}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Best Rank: #{track.rank}</span>
                        <span>•</span>
                        <span>Top 50: {track.days_in_top_50} days</span>
                      </div>
                    </div>
                    {track.isTopTrack && (
                      <Badge
                        variant="default"
                        className="flex-shrink-0 text-xs"
                      >
                        Top
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
