import os
import requests

access_token = os.environ.get('GENIUS_CLIENT_ACCESS_TOKEN')
if not access_token:
    print("Access token not found. Please set the GENIUS_CLIENT_ACCESS_TOKEN environment variable.")
    exit()

url = f'https://genius.com/api/search/multi?q=Get+Lucky+Daft+Punk&access_token={access_token}'

response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    # Process the data as needed
    print(data)
else:
    print(f"Error: {response.status_code}")