import * as d3 from "d3";
import "./style.css";
// Configuration
const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 1200 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

let pointSize = 6;
let showLabels = true;

// Create SVG
const svg = d3
  .select("#visualization")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("#tooltip");

// Color scale - generates a unique color for each artist
const colorScale = d3.scaleSequential().interpolator(d3.interpolateRainbow);

// Load and process data
d3.csv("umap_results.csv")
  .then((data) => {
    // Parse numeric values
    data.forEach((d) => {
      d.umap_x = +d.umap_x;
      d.umap_y = +d.umap_y;
      d.danceability = +d.danceability;
      d.energy = +d.energy;
      d.acousticness = +d.acousticness;
      d.valence = +d.valence;
      d.tempo = +d.tempo;
      d.track_count = +d.track_count;
      d.avg_popularity = +d.avg_popularity;
      d.speechiness = +d.speechiness;
      d.liveness = +d.liveness;
      d.loudness = +d.loudness;
      d.mode = +d.mode;
    });

    // Set color domain
    colorScale.domain([0, data.length]);

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.umap_x))
      .range([0, width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.umap_y))
      .range([height, 0])
      .nice();

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    svg
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    svg.append("g").attr("class", "axis y-axis").call(yAxis);

    // Add axis labels
    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .text("UMAP Dimension 1");

    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .text("UMAP Dimension 2");

    // Create artist points
    const points = svg
      .selectAll(".artist-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "artist-point")
      .attr("cx", (d) => xScale(d.umap_x))
      .attr("cy", (d) => yScale(d.umap_y))
      .attr("r", pointSize)
      .attr("fill", (d, i) => colorScale(i))
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("r", pointSize * 1.5)
          .attr("opacity", 1);

        tooltip
          .style("opacity", 1)
          .html(
            `
                            <div class="tooltip-artist">${d.artists}</div>
                            <div class="tooltip-stats">
                                <div><span class="tooltip-label">Tracks:</span> ${
                                  d.track_count
                                }</div>
                                <div><span class="tooltip-label">Popularity:</span> ${d.avg_popularity.toFixed(
                                  1
                                )}</div>
                                <div><span class="tooltip-label">Danceability:</span> ${d.danceability.toFixed(
                                  2
                                )}</div>
                                <div><span class="tooltip-label">Energy:</span> ${d.energy.toFixed(
                                  2
                                )}</div>
                                <div><span class="tooltip-label">Speechiness:</span> ${d.speechiness.toFixed(
                                  2
                                )}</div>
                                <div><span class="tooltip-label">Acousticness:</span> ${d.acousticness.toFixed(
                                  2
                                )}</div>
                                <div><span class="tooltip-label">Valence:</span> ${d.valence.toFixed(
                                  2
                                )}</div>
                                <div><span class="tooltip-label">Tempo:</span> ${d.tempo.toFixed(
                                  0
                                )} BPM</div>
                                <div><span class="tooltip-label">Loudness:</span> ${d.loudness.toFixed(
                                  1
                                )} dB</div>
                                <div><span class="tooltip-label">Mode:</span> ${
                                  d.mode === 1 ? "Major" : "Minor"
                                }</div>
                            </div>
                        `
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 15 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", pointSize).attr("opacity", 0.8);

        tooltip.style("opacity", 0);
      });

    // Add labels
    const labels = svg
      .selectAll(".artist-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "artist-label")
      .attr("x", (d) => xScale(d.umap_x) + pointSize + 3)
      .attr("y", (d) => yScale(d.umap_y) + 4)
      .text((d) => d.artists)
      .style("display", showLabels ? "block" : "none");

    // Controls
    d3.select("#pointSize").on("input", function () {
      pointSize = +this.value;
      points.attr("r", pointSize);
      labels.attr("x", (d) => xScale(d.umap_x) + pointSize + 3);
    });

    d3.select("#showLabels").on("change", function () {
      showLabels = this.checked;
      labels.style("display", showLabels ? "block" : "none");
    });

    console.log(`Loaded ${data.length} artists`);
  })
  .catch((error) => {
    console.error("Error loading data:", error);
    d3.select("#visualization")
      .append("p")
      .style("color", "#ff4444")
      .style("text-align", "center")
      .text(
        "Error loading data. Make sure 'umap_results.csv' is in the same directory."
      );
  });
