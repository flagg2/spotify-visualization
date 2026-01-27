"use client";

import React, { useEffect, useRef, useImperativeHandle, useState } from "react";
import * as d3 from "d3";
import "./d3-graph.css";

// Type definitions
interface Node extends d3.SimulationNodeDatum {
  id: string;
  index: number;
  track_count: number;
  avg_popularity: number;
  collaborator_count: number;
  top_tracks: { name: string; popularity: number }[];
  combinedRank?: number;
  rankSK?: number;
  rankCZ?: number;
  combinedAvgTop50Count?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: any;
  target: any;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface D3GraphProps {
  data: GraphData;
  onNodeClick: (node: Node | null) => void;
  chargeStrength: number;
  linkStrength: number;
}

const D3Graph = React.forwardRef(
  ({ data, onNodeClick, chargeStrength, linkStrength }: D3GraphProps, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    // @ts-ignore
    const simulationRef = useRef<d3.Simulation<Node, undefined>>();
    // @ts-ignore
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    useImperativeHandle(ref, () => ({
      centerOnNode: (node: Node) => {
        const svg = d3.select(svgRef.current);
        const zoom = zoomRef.current;

        if (!svg.node() || !zoom) return;

        const width = svg.node()!.getBoundingClientRect().width;
        const height = svg.node()!.getBoundingClientRect().height;

        const scale = 2.5;
        const x = width / 2 - (node.x || 0) * scale;
        const y = height / 2 - (node.y || 0) * scale;

        const transform = d3.zoomIdentity.translate(x, y).scale(scale);
        // @ts-ignore

        svg.transition().duration(750).call(zoom.transform, transform);
      },
      selectNode: (node: Node | null) => {
        setSelectedNode(node);
      },
    }));

    useEffect(() => {
      if (!data.nodes.length || !svgRef.current) return;

      const svg = d3.select(svgRef.current);
      const width = svg.node()!.getBoundingClientRect().width;
      const height = svg.node()!.getBoundingClientRect().height;

      svg.selectAll("*").remove(); // Clear previous render

      const g = svg.append("g");

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      zoomRef.current = zoom;
      svg.call(zoom);

      const colorScale = d3
        .scaleSequential(d3.interpolateGreens)
        .domain([0, 100]);

      // Calculate node radius based on combined average top 50 count
      // Higher combined average = larger bubble
      const getNodeRadius = (d: any) => {
        const combinedAvgTop50Count = d.combinedAvgTop50Count || 0;
        const minRadius = 2.4; // Minimum size for small nodes (40% smaller)
        const maxRadius = 26; // Maximum size for top artists (30% bigger)

        if (combinedAvgTop50Count === 0) {
          return minRadius;
        }

        // Find the maximum combinedAvgTop50Count across all nodes
        const maxCombinedAvg = Math.max(
          ...data.nodes.map((node: any) => node.combinedAvgTop50Count || 0),
        );

        if (maxCombinedAvg === 0) {
          return minRadius;
        }

        // Proportional scale: fraction of max determines size
        const fraction = combinedAvgTop50Count / maxCombinedAvg;
        const radiusRange = maxRadius - minRadius;

        return minRadius + radiusRange * fraction;
      };

      const simulation = d3
        .forceSimulation<Node>(data.nodes)
        .force(
          "link",
          d3.forceLink(data.links).distance(100).strength(linkStrength),
        )
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collision",
          d3.forceCollide().radius((d: any) => getNodeRadius(d) + 5),
        );

      simulationRef.current = simulation;

      const link = g
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("class", "link");

      const node = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", "node-group");

      node
        .append("circle")
        .attr("class", "node")
        .attr("r", getNodeRadius)
        .attr("fill", (d) => colorScale(d.avg_popularity));

      node
        .append("text")
        .attr("class", "node-label")
        .text((d) => d.id)
        .attr("dy", (d) => -(getNodeRadius(d) + 5));

      node.on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick(d);
      });

      svg.on("click", () => {
        setSelectedNode(null);
        onNodeClick(null);
      });

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x!)
          .attr("y1", (d) => d.source.y!)
          .attr("x2", (d) => d.target.x!)
          .attr("y2", (d) => d.target.y!);

        node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
      });
    }, [data]);

    useEffect(() => {
      if (!simulationRef.current) return;

      const node = d3.selectAll(".node-group");
      const link = d3.selectAll(".link");

      if (selectedNode) {
        const connectedIds = new Set<string>();
        connectedIds.add(selectedNode.id);

        data.links.forEach((l) => {
          if (l.source.id === selectedNode.id) connectedIds.add(l.target.id);
          if (l.target.id === selectedNode.id) connectedIds.add(l.source.id);
        });

        node.classed("dimmed", (d) => !connectedIds.has((d as Node).id));
        node.classed("highlighted", (d) => (d as Node).id === selectedNode.id);

        link.classed(
          "dimmed",
          (l) =>
            !(
              // @ts-ignore

              (
                 // @ts-ignore
                l.source.id === selectedNode.id ||
                // @ts-ignore

                l.target.id === selectedNode.id
              )
            ),
        );
      } else {
        node.classed("dimmed", false).classed("highlighted", false);
        link.classed("dimmed", false);
      }
    }, [selectedNode, data.links]);

    useEffect(() => {
      if (simulationRef.current) {
        simulationRef.current
          .force<d3.ForceManyBody<any>>("charge")
          ?.strength(chargeStrength);
        simulationRef.current
          .force<d3.ForceLink<any, any>>("link")
          ?.strength(linkStrength);
        simulationRef.current.alpha(1).restart();
      }
    }, [chargeStrength, linkStrength]);

    return (
      <div className="w-full h-full relative">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    );
  },
);

D3Graph.displayName = "D3Graph";
export { D3Graph };
