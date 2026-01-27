"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ArtistSidePanel } from "../components/artist-side-panel";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { D3Graph } from "../components/d3-graph";
import { Label } from "../components/ui/label";

interface Artist {
  name: string;
}

export default function Home() {
  const [artists, setArtists] = useState<Record<string, any>>({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(
    null,
  );
  const [selectedCountry, setSelectedCountry] = useState<"SK" | "CZ">("SK");
  const graphRef = useRef<any>(null);

  // Hardcoded physics values
  const chargeStrength = -200;
  const linkStrength = 1;

  useEffect(() => {
    // Fetch artist details for the side panel
    fetch("/artist_details.json")
      .then((res) => res.json())
      .then(setArtists);

    // Fetch collaboration network data for the graph
    fetch("/collab_network.json")
      .then((res) => res.json())
      .then(setGraphData);
  }, []);

  // Calculate rankings based on average tracks in top 50
  const artistsWithRanks = useMemo(() => {
    if (Object.keys(artists).length === 0) return { byCountry: {}, byName: {} };

    // Group artists by country
    const byCountry: Record<string, any[]> = { SK: [], CZ: [] };
    const byName: Record<string, Record<string, any>> = {};

    Object.entries(artists).forEach(([key, data]: [string, any]) => {
      const country = data.country;
      const name = data.name;

      // Calculate average top50Count
      const avgTop50Count =
        data.top50History?.length > 0
          ? data.top50History.reduce(
              (sum: number, item: any) => sum + (item.top50Count || 0),
              0,
            ) / data.top50History.length
          : 0;

      const enrichedData = {
        ...data,
        avgTop50Count,
        originalKey: key,
      };

      if (byCountry[country]) {
        byCountry[country].push(enrichedData);
      }

      if (!byName[name]) {
        byName[name] = {};
      }
      byName[name][country] = enrichedData;
    });

    // Sort and assign ranks per country
    Object.keys(byCountry).forEach((country) => {
      byCountry[country].sort((a, b) => b.avgTop50Count - a.avgTop50Count);
      byCountry[country].forEach((artist, index) => {
        const rankKey = `rank${country}`;
        artist[rankKey] = index + 1;
        // Update in byName as well
        if (byName[artist.name]?.[country]) {
          byName[artist.name][country][rankKey] = index + 1;
        }
      });
    });

    return { byCountry, byName };
  }, [artists]);

  // Enrich graph data with combined rankings
  const enrichedGraphData = useMemo(() => {
    if (
      !graphData.nodes ||
      graphData.nodes.length === 0 ||
      !graphData.links ||
      Object.keys(artistsWithRanks.byName).length === 0
    ) {
      return { nodes: [], links: [] };
    }

    const enrichedNodes = graphData.nodes.map((node: any) => {
      const artistName = node.id;
      const artistData = artistsWithRanks.byName[artistName];

      if (artistData) {
        const skRank = artistData["SK"]?.rankSK || 9999;
        const czRank = artistData["CZ"]?.rankCZ || 9999;
        const skAvgTop50 = artistData["SK"]?.avgTop50Count || 0;
        const czAvgTop50 = artistData["CZ"]?.avgTop50Count || 0;

        // Combined score: lower is better (rank 1 is best)
        // Average the ranks, but if only in one country, use that rank
        let combinedRank;
        if (skRank === 9999 && czRank === 9999) {
          combinedRank = 9999;
        } else if (skRank === 9999) {
          combinedRank = czRank;
        } else if (czRank === 9999) {
          combinedRank = skRank;
        } else {
          combinedRank = (skRank + czRank) / 2;
        }

        // Sum of average top 50 counts from both countries
        const combinedAvgTop50Count = skAvgTop50 + czAvgTop50;

        return {
          ...node,
          rankSK: skRank,
          rankCZ: czRank,
          combinedRank,
          combinedAvgTop50Count,
        };
      }

      return { ...node, combinedRank: 9999, combinedAvgTop50Count: 0 };
    });

    return {
      nodes: enrichedNodes,
      links: graphData.links,
    };
  }, [graphData, artistsWithRanks]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredArtists([]);
    } else {
      const results = enrichedGraphData.nodes
        .filter((node: any) =>
          node.id.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 10);
      setFilteredArtists(results as any);
    }
  }, [searchTerm, enrichedGraphData.nodes]);

  // Update selected artist data when country changes
  useEffect(() => {
    if (selectedArtistName) {
      const countrySpecificData =
        artistsWithRanks.byName[selectedArtistName]?.[selectedCountry];
      if (countrySpecificData) {
        // Always update to the current country's data
        setSelectedArtist(countrySpecificData);
      } else {
        // Artist doesn't exist in this country, keep name but clear data to show message
        setSelectedArtist(null);
      }
    }
  }, [selectedCountry, artistsWithRanks, selectedArtistName]);

  const handleArtistSelect = (artist: any | null) => {
    if (!artist) {
      setSelectedArtist(null);
      setSelectedArtistName(null);
      if (graphRef.current) {
        graphRef.current.selectNode(null);
      }
      return;
    }

    // Look up the country-specific data
    const artistName = artist.id;
    setSelectedArtistName(artistName);
    const countryData = artistsWithRanks.byName[artistName];

    if (countryData && countryData[selectedCountry]) {
      // Set the artist data for the currently selected country
      setSelectedArtist(countryData[selectedCountry]);
    } else {
      // Artist doesn't exist in selected country, clear data but keep name
      setSelectedArtist(null);
    }

    // Update the graph's internal selection state
    if (graphRef.current) {
      graphRef.current.selectNode(artist);
    }
  };

  const centerOnArtist = (artist: any) => {
    if (graphRef.current) {
      const nodeToCenter = enrichedGraphData.nodes.find(
        (n: any) => n.id === artist.id,
      );
      if (nodeToCenter) {
        graphRef.current.centerOnNode(nodeToCenter);
      }
    }
    handleArtistSelect(artist);
  };

  return (
    <main className="flex h-screen overflow-hidden">
      <div className="flex-1 p-4 h-full">
        <D3Graph
          data={enrichedGraphData}
          onNodeClick={handleArtistSelect}
          ref={graphRef}
          chargeStrength={chargeStrength}
          linkStrength={linkStrength}
        />
      </div>

      <div className="w-1/3 max-w-md p-4 border-l flex flex-col gap-4 h-full">
        <Card>
          <CardHeader>
            <CardTitle>Search Artist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                id="artistSearch"
                type="text"
                placeholder="Enter artist name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredArtists.length > 0 && (
                <ul className="absolute z-10 w-full bg-background border mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredArtists.map((artist: any) => (
                    <li
                      key={artist.id}
                      onClick={() => {
                        centerOnArtist(artist);
                        setSearchTerm(""); // Clear search on select
                      }}
                      className="cursor-pointer p-2 text-sm hover:bg-accent rounded"
                    >
                      {artist.id}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button
            variant={selectedCountry === "SK" ? "default" : "outline"}
            onClick={() => setSelectedCountry("SK")}
            className="flex-1"
          >
            Slovakia
          </Button>
          <Button
            variant={selectedCountry === "CZ" ? "default" : "outline"}
            onClick={() => setSelectedCountry("CZ")}
            className="flex-1"
          >
            Czech Rep.
          </Button>
        </div>
        <ArtistSidePanel
          artistData={selectedArtist}
          selectedCountry={selectedCountry}
          artistName={selectedArtistName}
        />
      </div>
    </main>
  );
}
