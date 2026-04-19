import pandas as pd
import ast
import boto3
from tqdm import tqdm

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
table = dynamodb.Table('movies')

# Load datasets
movies = pd.read_csv('datasets/tmdb_5000_movies.csv')
credits = pd.read_csv('datasets/tmdb_5000_credits.csv')

# Merge datasets
movies = movies.merge(credits, on="title")

# Select useful columns
movies = movies[['movie_id','title','overview','genres','keywords','cast','crew']]

# Drop missing values
movies.dropna(inplace=True)

# Helper functions
def convert(obj):
    L = []
    for i in ast.literal_eval(obj):
        L.append(i['name'])
    return L

def get_cast(obj):
    L = []
    count = 0
    for i in ast.literal_eval(obj):
        if count < 3:
            L.append(i['name'])
            count += 1
        else:
            break
    return L

def get_director(obj):
    for i in ast.literal_eval(obj):
        if i['job'] == 'Director':
            return i['name']
    return ""

# Apply transformations
movies['genres'] = movies['genres'].apply(convert)
movies['keywords'] = movies['keywords'].apply(convert)
movies['cast'] = movies['cast'].apply(get_cast)
movies['crew'] = movies['crew'].apply(get_director)

# Create tags
movies['tags'] = movies['overview'] + " " + movies['genres'].apply(lambda x: " ".join(x)) + " " + movies['keywords'].apply(lambda x: " ".join(x)) + " " + movies['cast'].apply(lambda x: " ".join(x)) + " " + movies['crew']

# Clean tags
movies['tags'] = movies['tags'].apply(lambda x: x.lower())

# Upload to DynamoDB
print("Uploading movies to DynamoDB...")

for _, row in tqdm(movies.iterrows(), total=len(movies)):
    try:
        table.put_item(
            Item={
                "movie_id": str(row['movie_id']),
                "title": row['title'],
                "overview": row['overview'],
                "tags": row['tags']
            }
        )
    except Exception as e:
        print(f"Error inserting {row['title']}: {e}")

print("Upload completed.")