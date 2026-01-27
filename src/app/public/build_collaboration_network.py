import pandas as pd
import json
from collections import defaultdict, Counter

def build_collaboration_network(input_file, countries=None, output_file='collab_network.json'):
    """
    Build a collaboration network from Spotify chart data.
    
    Parameters:
    - input_file: path to input CSV
    - countries: list of country codes to filter (e.g., ['CZ', 'SK']), or None for all countries (default: ['CZ', 'SK'])
    - output_file: path to output JSON file
    """
    
    # Default to CZ and SK if not specified
    if countries is None:
        countries = ['CZ', 'SK']
    
    country_str = ', '.join(countries) if countries else 'All Countries'
    
    print("=" * 70)
    print(f"🎵 Building Collaboration Network for {country_str}")
    print("=" * 70)
    
    # Read the data
    print("\nReading data...")
    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} total rows")
    
    # Filter for specific countries
    if countries:
        df_filtered = df[df['country'].isin(countries)].copy()
        print(f"Filtered to {country_str}: {len(df_filtered)} rows")
        
        # Deduplicate by spotify_id to get unique tracks
        df_unique = df_filtered.drop_duplicates(subset='spotify_id', keep='first')
        print(f"After deduplication: {len(df_unique)} unique tracks")
    else:
        # No filtering - use all countries
        df_unique = df.drop_duplicates(subset='spotify_id', keep='first')
        print(f"No country filter - using all data")
        print(f"After deduplication: {len(df_unique)} unique tracks")
    
    # Data structures for network
    artist_stats = defaultdict(lambda: {
        'name': '',
        'track_count': 0,
        'total_popularity': 0,
        'collaborations': defaultdict(int),
        'tracks': []
    })
    
    collaboration_pairs = defaultdict(int)
    
    # Process each track
    print("\n📊 Processing tracks and collaborations...")
    multi_artist_tracks = 0
    
    for idx, row in df_unique.iterrows():
        artists_str = row['artists']
        if pd.isna(artists_str):
            continue
        
        # Split artists
        artists = [a.strip() for a in artists_str.split(',')]
        
        if len(artists) > 1:
            multi_artist_tracks += 1
        
        # Update artist stats
        for artist in artists:
            artist_stats[artist]['name'] = artist
            artist_stats[artist]['track_count'] += 1
            artist_stats[artist]['total_popularity'] += row['popularity']
            artist_stats[artist]['tracks'].append({
                'name': row['name'],
                'popularity': int(row['popularity'])
            })
        
        # Track collaborations (pairs)
        if len(artists) > 1:
            for i, artist1 in enumerate(artists):
                for artist2 in artists[i+1:]:
                    # Create sorted pair to avoid duplicates (A-B same as B-A)
                    pair = tuple(sorted([artist1, artist2]))
                    collaboration_pairs[pair] += 1
                    
                    # Track in artist_stats
                    artist_stats[artist1]['collaborations'][artist2] += 1
                    artist_stats[artist2]['collaborations'][artist1] += 1
    
    print(f"Found {len(artist_stats)} unique artists")
    print(f"Found {multi_artist_tracks} multi-artist tracks")
    print(f"Found {len(collaboration_pairs)} unique collaboration pairs")
    
    # Calculate average popularity per artist
    for artist in artist_stats:
        track_count = artist_stats[artist]['track_count']
        artist_stats[artist]['avg_popularity'] = (
            artist_stats[artist]['total_popularity'] / track_count if track_count > 0 else 0
        )
    
    # Find most prolific artists
    print("\n🌟 Top 10 Most Prolific Artists:")
    top_artists = sorted(artist_stats.items(), key=lambda x: x[1]['track_count'], reverse=True)[:10]
    for artist, stats in top_artists:
        print(f"   {artist}: {stats['track_count']} tracks, {len(stats['collaborations'])} collaborators")
    
    # Find most frequent collaborations
    print("\n🤝 Top 10 Most Frequent Collaborations:")
    top_collabs = sorted(collaboration_pairs.items(), key=lambda x: x[1], reverse=True)[:10]
    for (artist1, artist2), count in top_collabs:
        print(f"   {artist1} ↔ {artist2}: {count} tracks")
    
    # Build network data structure for D3
    print("\n🕸️  Building network structure...")
    
    # Nodes
    nodes = []
    artist_to_index = {}
    for idx, (artist, stats) in enumerate(artist_stats.items()):
        artist_to_index[artist] = idx
        nodes.append({
            'id': artist,
            'index': idx,
            'track_count': stats['track_count'],
            'avg_popularity': round(stats['avg_popularity'], 1),
            'collaborator_count': len(stats['collaborations']),
            'top_tracks': sorted(stats['tracks'], key=lambda x: x['popularity'], reverse=True)[:5]
        })
    
    # Links (edges)
    links = []
    for (artist1, artist2), count in collaboration_pairs.items():
        links.append({
            'source': artist_to_index[artist1],
            'target': artist_to_index[artist2],
            'weight': count,
            'artist1': artist1,
            'artist2': artist2
        })
    
    # Create final network object
    network = {
        'nodes': nodes,
        'links': links,
        'metadata': {
            'countries': country_str,
            'total_artists': len(nodes),
            'total_collaborations': len(links),
            'total_tracks': len(df_unique)
        }
    }
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(network, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Network saved to {output_file}")
    print(f"   - {len(nodes)} artists (nodes)")
    print(f"   - {len(links)} collaborations (edges)")
    
    # Network statistics
    collab_weights = [link['weight'] for link in links]
    if collab_weights:
        print("\n📈 Collaboration Statistics:")
        print(f"   - Average collaborations per pair: {sum(collab_weights) / len(collab_weights):.2f}")
        print(f"   - Max collaborations (single pair): {max(collab_weights)}")
        print(f"   - Min collaborations (single pair): {min(collab_weights)}")
    
    # Artist degree distribution
    degrees = [node['collaborator_count'] for node in nodes]
    print("\n🔗 Artist Connection Statistics:")
    print(f"   - Average collaborators per artist: {sum(degrees) / len(degrees):.2f}")
    print(f"   - Most connected artist: {max(degrees)} collaborators")
    print(f"   - Artists with no collaborations: {degrees.count(0)}")
    
    return network

if __name__ == "__main__":
    input_file = "spotify_data.csv"
    output_file = "collab_network.json"
    
    # Examples of how to use:
    
    # Default: CZ + SK
    network = build_collaboration_network(
        input_file=input_file,
        output_file=output_file
    )
    
    # Single country:
    # network = build_collaboration_network(
    #     input_file=input_file,
    #     countries=['CZ'],
    #     output_file=output_file
    # )
    
    # Multiple countries:
    # network = build_collaboration_network(
    #     input_file=input_file,
    #     countries=['CZ', 'SK', 'PL'],
    #     output_file=output_file
    # )
    
    # All countries (no filter):
    # network = build_collaboration_network(
    #     input_file=input_file,
    #     countries=[],  # Empty list = all countries
    #     output_file=output_file
    # )
    
    print("\n" + "=" * 70)
    print("✨ Processing complete!")
    print("=" * 70)
    print(f"Output: {output_file}")
    print("Next step: Open the HTML visualization file in your browser!")