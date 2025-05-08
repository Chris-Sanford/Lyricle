#!/usr/bin/env python3
import json
import base64
import os
import re

def load_json_file(file_path):
    """Load and parse a JSON file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def save_json_file(file_path, data):
    """Save data to a JSON file with proper formatting."""
    # Ensure the directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

def decode_banned_words(base64_words):
    """Decode base64 encoded banned words."""
    return [base64.b64decode(word).decode('utf-8') for word in base64_words]

def censor_text(text, banned_words):
    """Replace banned words with asterisks."""
    if not text:
        return text
        
    censored_text = text
    for word in banned_words:
        # Create a pattern that matches the word as a whole word, case insensitive
        pattern = r'\b' + re.escape(word) + r'\b'
        
        # Replace each letter with an asterisk
        replacement = '*' * len(word)
        
        # Replace all occurrences
        censored_text = re.sub(pattern, replacement, censored_text, flags=re.IGNORECASE)
    
    return censored_text

def censor_game_data(uncensored_data, banned_words):
    """Censor all instances of banned words in the game data."""
    censored_data = []
    
    for song in uncensored_data:
        # Create a copy of the song
        censored_song = song.copy()
        
        # Censor the chorus
        censored_song['chorus'] = censor_text(song['chorus'], banned_words)
        
        # Add to censored data
        censored_data.append(censored_song)
    
    return censored_data

def main():
    # File paths
    banned_words_path = 'api/bannedWords.json'
    uncensored_data_path = 'data/uncensoredGameData.json'
    censored_data_path = 'data/gameData.json'
    
    # Load banned words and decode from base64
    banned_words_data = load_json_file(banned_words_path)
    banned_words = decode_banned_words(banned_words_data['bannedWordsBase64'])
    
    # Load uncensored game data
    uncensored_data = load_json_file(uncensored_data_path)
    
    # Censor the game data
    censored_data = censor_game_data(uncensored_data, banned_words)
    
    # Save censored data to gameData.json
    save_json_file(censored_data_path, censored_data)
    
    print(f"Censored {len(banned_words)} banned words in {len(uncensored_data)} songs.")
    print(f"Saved censored data to {censored_data_path}")

if __name__ == "__main__":
    main() 