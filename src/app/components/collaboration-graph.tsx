"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

// Define types for graph data
interface Node {
  id: string;
  index: number;
  track_count: number;
  avg_popularity: number;
  // Add other node properties as needed
}

interface Link {
  source: string | number | Node;
  target: string | number | Node;
  weight: number;
  // Add other link properties as needed
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface CollaborationGraphProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  graphRef: React.RefObject<any>;
  chargeStrength: number;
  linkStrength: number;
}

export const CollaborationGraph = ({
  data,
  onNodeClick,
  graphRef,
  chargeStrength,
  linkStrength,
}: CollaborationGraphProps) => {
  const handleNodeClick = useCallback(
    (node: any) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  const getNodeRadius = (node: Node) => {
    return Math.sqrt(node.track_count) * 2;
  };

  const getNodeColor = (node: Node) => {
    // A simple color scale from light gray to green based on popularity
    const popularityRatio = node.avg_popularity / 100;
    const greenValue = Math.round(150 + 105 * popularityRatio);
    return `rgb(200, ${greenValue}, 200)`;
  };

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;
      fg.d3Force("charge")!.strength(chargeStrength);
      fg.d3Force("link")!.strength(linkStrength);
      fg.d3ReheatSimulation();
    }
  }, [chargeStrength, linkStrength, graphRef]);

  return (
    <div className="w-full h-full border-2 border-dashed rounded-lg overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel="id"
        nodeVal={(node) => getNodeRadius(node) * 5}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const radius = getNodeRadius(node as Node);
          const fontSize = 12 / globalScale;

          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node as Node);
          ctx.fill();

          // Draw label
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#333";
          ctx.fillText(label, node.x!, node.y! + radius + fontSize);
        }}
        linkWidth={(link) => Math.sqrt((link as Link).weight) * 2}
        linkColor={() => "rgba(0,0,0,0.5)"}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={() => "#1db954"}
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400)}
      />
    </div>
  );
};
