# Spotify Artist Popularity and Collaboration Visualization

An interactive visualization of Spotify artist collaborations and popularity trends across Slovakia and Czech Republic.

## Project Structure

### `/presentation`

Final presentation slides for the project.

### `/report`

Project report in LaTeX format:

- `main.tex` - LaTeX source document
- `main.pdf` - Compiled PDF report

### `/video`

Final video presentation demonstrating the visualization and its interactive features.

### `/src`

Source code for the web application:

- `/src/app` - Next.js application with React components
  - `/app/page.tsx` - Main page with graph and layout
  - `/components/d3-graph.tsx` - Force-directed graph visualization
  - `/components/artist-side-panel.tsx` - Artist details panel
  - `/api/spotify` - Spotify API integration endpoint
  - `/public` - Static assets and data files
    - `artist_details.json` - Preprocessed artist data
    - `collab_network.json` - Collaboration network graph data
    - `spotify_data.csv` - Raw CSV data
    - `preprocess.py` - Python script to generate JSON from raw CSV data

## View Demo

A live demo of the application is hosted [here](http://i8c888wws0cw4wg04480wgkw.159.69.41.251.sslip.io/).

## Running locally

### Prerequisites

- Node.js and npm/yarn/bun
- Python 3.7+ (for data preprocessing)

### Setup

1. **Install dependencies:**

   ```bash
   cd src/app
   bun install
   # or: npm install / yarn install
   ```

2. **Configure Spotify API:**
   Create a `.env.local` file in `src/app/` with your Spotify API credentials:

   ```
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
   NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

   Get these credentials from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

3. **Data preprocessing (optional):**
   If you want to regenerate the data from raw CSV:
   ```bash
   cd src/app/public
   python preprocess.py
   ```
   This requires the `spotify_data.csv` file in the same directory.

### Running the Application

```bash
cd src/app
bun run dev
# or: npm run dev / yarn dev
```

The application will be available at `http://localhost:3000`
