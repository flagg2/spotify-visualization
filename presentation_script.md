# Video Presentation Script: Spotify Artist Collaboration Network Visualization

## Introduction (30 seconds)

"Hello, I'm presenting an interactive visualization of Spotify top 50 chart data from Slovakia and the Czech Republic. This project analyzes artist collaborations, chart performance, and musical characteristics across both countries over time."

## The Data (45 seconds)

"The dataset consists of Spotify top 50 charts from Slovakia and Czech Republic, containing:
- Daily chart rankings spanning multiple years
- Over [X] unique artists and [Y] tracks
- Audio features including danceability, energy, tempo, and more
- Collaboration patterns between artists
- Historical performance data tracked monthly

The data was preprocessed using Python with pandas to aggregate artist statistics, calculate rankings, and build the collaboration network based on shared tracks."

## Main Visualization Overview (30 seconds)

"The main visualization is a force-directed graph where:
- Each bubble represents an artist
- Bubble size reflects their combined popularity across both countries—calculated from average top 50 track counts
- Bubble color indicates overall popularity
- Lines connect artists who have collaborated on tracks
- The larger the bubble, the more successful the artist has been in both markets"

## Interactive Element 1: Country Filter (30 seconds)

"At the top right, you can switch between Slovakia and Czech Republic. Watch what happens when I click between them..."

[Demonstrate switching]

"Notice how the side panel updates to show country-specific data—rankings, track listings, and chart history change based on the selected market. Artists who don't appear in a country's top 50 charts display a message indicating they have no data for that market."

## Interactive Element 2: Search and Navigation (30 seconds)

"The search bar lets you quickly find any artist. As I type, suggestions appear..."

[Demonstrate typing and selecting]

"Selecting an artist zooms and centers the graph on their position, while simultaneously loading their detailed statistics in the side panel. You can also click directly on any bubble in the graph to explore that artist."

## Interactive Element 3: Graph Interactions (30 seconds)

"The graph itself is fully interactive:
- Zoom in and out with your mouse wheel to explore dense areas
- Pan by clicking and dragging the background
- The physics simulation naturally clusters collaborators together
- Click any artist bubble to view their details
- Click the background to deselect"

## Side Panel: Quick Stats (30 seconds)

"The side panel provides comprehensive artist information. At the top we see:
- Artist image and Spotify link
- Genre tags
- Country-specific ranking—this artist is #[X] in Slovakia
- Quick statistics showing tracks in dataset, average tempo, duration, and collaboration ratio"

## Side Panel: Charts - Songs in Top 50 (45 seconds)

"The first chart shows 'Songs in Top 50' over time—a bar chart tracking how many unique songs this artist had charting each month.

Key features:
- The time window is consistent across all artists, showing the full dataset range
- Months with zero songs still appear, giving accurate context
- The Y-axis maximum is calculated from the highest count across BOTH countries, so when you switch countries, the scale remains constant for easy comparison
- Year labels mark the timeline"

## Side Panel: Charts - Best Rank (30 seconds)

"The second chart displays 'Best Rank' history—showing the highest position any of their tracks reached each month.

Notice:
- The Y-axis is inverted—rank 1 at the top means better performance
- The scale is fixed from 1 to 50
- The line tracks their peak performance over time
- Gaps indicate months with no top 50 presence"

## Side Panel: Audio Fingerprint (30 seconds)

"The radar chart shows the artist's 'Audio Fingerprint'—average audio characteristics of their top 50 tracks:
- Danceability, Energy, Valence
- Speechiness, Acousticness, Instrumentalness, and Liveness
- This gives a quick visual profile of their musical style
- Each attribute is normalized from 0 to 100"

## Side Panel: Popular Tracks (30 seconds)

"Finally, the popular tracks section lists their top performing songs:
- Track covers load dynamically from Spotify's API
- Gray squares appear when covers aren't available
- Each track shows best rank achieved and days in the top 50
- The 'Top' badge indicates their single most successful track based on chart duration and rank
- Switching countries updates which tracks appear and their statistics"

## Technical Implementation (30 seconds)

"The visualization is built with:
- Next.js and React for the frontend framework
- D3.js for the force-directed graph with custom node sizing
- Recharts for the statistical charts
- TanStack Query for efficient data fetching and caching
- Python with pandas for data preprocessing

All interactions are real-time with no page reloads, and the country filtering is deeply integrated to ensure data consistency."

## Insights and Conclusion (30 seconds)

"This visualization reveals:
- Which artists dominate in one market versus both
- Collaboration networks within the regional music scene
- How artist popularity fluctuates over time
- Musical characteristics that define successful artists in each country

The interactive design allows users to explore their favorite artists, discover collaborations, and understand chart dynamics across both markets. Thank you for watching."

---

**Total Runtime: ~6-7 minutes**

**Notes for Recording:**
- Pause to demonstrate each interaction as you describe it
- Show concrete examples with specific artist names
- Switch between countries multiple times to emphasize the dynamic updating
- Zoom and pan the graph naturally while explaining
- Hover over charts to show the tooltips
- Click through 2-3 different artists to show variety in data
