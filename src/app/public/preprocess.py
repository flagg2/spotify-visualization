import pandas as pd
import json
from collections import defaultdict
import numpy as np

def format_duration_ms(ms):
    seconds = int((ms / 1000) % 60)
    minutes = int((ms / (1000 * 60)) % 60)
    return f"{minutes}:{seconds:02d}"

def process_data(input_path, output_path):
    print("Starting data processing...")
    try:
        df = pd.read_csv(input_path, low_memory=False)
        print("CSV loaded successfully.")
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_path}")
        return

    # Filter for specific countries
    countries_to_include = ['CZ', 'SK']
    df = df[df['country'].isin(countries_to_include)]
    print(f"Filtered data for countries: {countries_to_include}. New shape: {df.shape}")

    # Data cleaning and type conversion
    df['snapshot_date'] = pd.to_datetime(df['snapshot_date'], errors='coerce')
    df.dropna(subset=['snapshot_date', 'artists', 'name', 'spotify_id'], inplace=True)
    df['artists'] = df['artists'].astype(str)
    
    numeric_cols = ['daily_rank', 'popularity', 'duration_ms', 'danceability', 'energy', 
                    'loudness', 'speechiness', 'acousticness', 'instrumentalness', 
                    'liveness', 'valence', 'tempo']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df.dropna(subset=numeric_cols, inplace=True)

    print("Data cleaning and preparation finished.")

    artists_data = defaultdict(lambda: defaultdict(lambda: {
        'tracks': [],
        'name': '',
        'country': ''
    }))

    # Group tracks by artist AND country
    for _, row in df.iterrows():
        artists = [artist.strip() for artist in row['artists'].split(',')]
        country = row['country']
        for artist_name in artists:
            if not artist_name: continue

            key = f"{artist_name}_{country}"
            artists_data[artist_name][country]['name'] = artist_name
            artists_data[artist_name][country]['country'] = country
            artists_data[artist_name][country]['tracks'].append({
                'id': row['spotify_id'],
                'title': row['name'],
                'artists': row['artists'],
                'rank': row['daily_rank'],
                'popularity': row['popularity'],
                'duration_ms': row['duration_ms'],
                'album_name': row['album_name'],
                'album_release_date': row['album_release_date'],
                'danceability': row['danceability'],
                'energy': row['energy'],
                'valence': row['valence'],
                'speechiness': row['speechiness'],
                'acousticness': row['acousticness'],
                'instrumentalness': row['instrumentalness'],
                'liveness': row['liveness'],
                'tempo': row['tempo'],
                'snapshot_date': row['snapshot_date'],
                'country': row['country']
            })

    print(f"Processed {len(artists_data)} unique artists.")

    final_artists_data = {}
    
    # Aggregate data for each artist-country combination
    for artist_name, countries_data in artists_data.items():
        for country, data in countries_data.items():
            artist_tracks = pd.DataFrame(data['tracks'])
            if artist_tracks.empty:
                continue

            best_rank_track = artist_tracks.loc[artist_tracks['rank'].idxmin()]
            
            # Audio Profile (scaled to 0-100)
            audio_profile = [
                {"attribute": "Danceability", "value": round(artist_tracks['danceability'].mean() * 100)},
                {"attribute": "Energy", "value": round(artist_tracks['energy'].mean() * 100)},
                {"attribute": "Valence", "value": round(artist_tracks['valence'].mean() * 100)},
                {"attribute": "Speechiness", "value": round(artist_tracks['speechiness'].mean() * 100)},
                {"attribute": "Acousticness", "value": round(artist_tracks['acousticness'].mean() * 100)},
                {"attribute": "Instrumentalness", "value": round(artist_tracks['instrumentalness'].mean() * 100)},
                {"attribute": "Liveness", "value": round(artist_tracks['liveness'].mean() * 100)},
            ]

            # Top 50 History
            artist_tracks['month'] = artist_tracks['snapshot_date'].dt.to_period('M')
            top50_history_grouped = artist_tracks[artist_tracks['rank'] <= 50].groupby('month')
            
            top50_history = []
            if not top50_history_grouped.groups:
                # Add at least one entry if no top 50 history to prevent errors
                latest_date = artist_tracks['snapshot_date'].max()
                if pd.notna(latest_date):
                    top50_history.append({
                        'date': latest_date.strftime('%Y-%m'),
                        'displayDate': latest_date.strftime('%b %Y'),
                        'top50Count': 0,
                        'bestRankInMonth': None,
                        'isYearStart': latest_date.month == 1,
                        'isQuarter': latest_date.month in [1, 4, 7, 10]
                    })
            else:
                for month, group in top50_history_grouped:
                    first_day = month.to_timestamp()
                    top50_history.append({
                        'date': month.strftime('%Y-%m'),
                        'displayDate': first_day.strftime('%b %Y'),
                        'top50Count': len(group['id'].unique()),
                        'bestRankInMonth': int(group['rank'].min()),
                        'isYearStart': month.month == 1,
                        'isQuarter': month.month in [1, 4, 7, 10]
                    })
            top50_history.sort(key=lambda x: x['date'])


            # Aggregate stats for ALL tracks to get general info
            track_agg_all = artist_tracks.groupby('id').agg(
                best_rank=('rank', 'min'),
                max_popularity=('popularity', 'max'),
                title=('title', 'first'),
                artists=('artists', 'first'),
                duration_ms=('duration_ms', 'first')
            ).reset_index()

            # Aggregate stats for TOP 50 tracks to find chart duration
            artist_tracks_top50 = artist_tracks[artist_tracks['rank'] <= 50]
            track_agg_top50 = artist_tracks_top50.groupby('id').agg(
                days_in_top_50=('snapshot_date', 'nunique')
            ).reset_index()

            # Merge the two aggregations
            track_agg = pd.merge(track_agg_all, track_agg_top50, on='id', how='left')
            track_agg['days_in_top_50'] = track_agg['days_in_top_50'].fillna(0).astype(int)
            
            # Corrected Stats Calculation (using all unique tracks)
            total_unique_tracks = len(track_agg)
            unique_collab_tracks = track_agg['artists'].apply(lambda x: ',' in str(x)).sum()
            
            stats = {
                'tracksInDataset': total_unique_tracks,
                'avgTempo': round(artist_tracks['tempo'].mean()),
                'avgDuration': format_duration_ms(artist_tracks['duration_ms'].mean()),
                'collabRatio': round((unique_collab_tracks / total_unique_tracks) * 100) if total_unique_tracks > 0 else 0
            }

            # Sort tracks by days in top 50 (descending), then by best rank (ascending)
            track_agg = track_agg.sort_values(by=['days_in_top_50', 'best_rank'], ascending=[False, True])

            # Determine the overall top track for the artist based on the new sorting
            best_track_id = track_agg.iloc[0]['id'] if not track_agg.empty else None

            # Format tracks list
            processed_tracks = []
            for _, track in track_agg.iterrows():
                processed_tracks.append({
                    'id': track['id'],
                    'title': track['title'],
                    'artists': track['artists'],
                    'rank': int(track['best_rank']),
                    'popularity': int(track['max_popularity']),
                    'duration': format_duration_ms(track['duration_ms']),
                    'days_in_top_50': track['days_in_top_50'],
                    'isTopTrack': track['id'] == best_track_id,
                })

            # Use a composite key: "ArtistName (Country)"
            key = f"{artist_name} ({country})"
            final_artists_data[key] = {
                'name': artist_name,
                'rank': int(best_rank_track['rank']),
                'country': country,
                'stats': stats,
                'top50History': top50_history,
                'audioProfile': audio_profile,
                'tracks': processed_tracks,
            }
    
    print(f"Aggregated data for {len(final_artists_data)} artist-country combinations.")

    with open(output_path, 'w') as f:
        json.dump(final_artists_data, f, indent=2)

    print(f"Data processing complete. Output saved to {output_path}")

if __name__ == '__main__':
    # Assuming the script is in public/ and data is also in public/
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_csv = os.path.join(script_dir, 'spotify_data.csv')
    output_json = os.path.join(script_dir, 'artist_details.json')
    process_data(input_csv, output_json)
