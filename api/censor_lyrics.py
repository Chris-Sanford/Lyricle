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
    
    # Hard-coded replacements for specific problematic cases
    specific_patterns = {
        "Yeah, bitch,": "Yeah, *****,",
        "Yeah, bitch": "Yeah, *****",
        "Bitch, I said": "*****, I said",
        "bitch, I said": "*****, I said",
        "little bitch-ass": "little *****-***",
        "that bitch like": "that ***** like",
        "pass that bitch": "pass that *****",
        "bitch like Stockton": "***** like Stockton",
        "your little bitch": "your little *****"
    }
    
    # Apply specific replacements first
    for pattern, replacement in specific_patterns.items():
        censored_text = censored_text.replace(pattern, replacement)
    
    # Process each banned word
    for word in banned_words:
        word_lower = word.lower()
        
        # Simple case: exact word match with word boundaries
        pattern = r'\b' + re.escape(word_lower) + r'\b'
        censored_text = re.sub(pattern, '*' * len(word_lower), censored_text, flags=re.IGNORECASE)
        
        # Replace the word at the beginning of lines
        line_start_pattern = r'(^|\n)(' + re.escape(word_lower) + r')'
        censored_text = re.sub(line_start_pattern, r'\1' + '*' * len(word_lower), censored_text, flags=re.IGNORECASE)
    
    # Handle hyphenated combinations separately
    for word in banned_words:
        word_lower = word.lower()
        
        # For word-xxx pattern
        prefix_pattern = r'\b' + re.escape(word_lower) + r'-\w+'
        
        def replace_prefix(match):
            text = match.group(0)
            parts = text.split('-', 1)
            return '*' * len(parts[0]) + '-' + parts[1]
        
        censored_text = re.sub(prefix_pattern, replace_prefix, censored_text, flags=re.IGNORECASE)
        
        # For xxx-word pattern
        suffix_pattern = r'\w+-' + re.escape(word_lower) + r'\b'
        
        def replace_suffix(match):
            text = match.group(0)
            parts = text.split('-', 1)
            return parts[0] + '-' + '*' * len(parts[1])
        
        censored_text = re.sub(suffix_pattern, replace_suffix, censored_text, flags=re.IGNORECASE)
    
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

def manual_censor_specific_songs(censored_data):
    """Manually censor specific songs that need special handling."""
    for song in censored_data:
        # Paint The Town Red by Doja Cat
        if song['spotify_id'] == '56y1jOTK0XSvJzVv9vHQBK':
            song['chorus'] = "Yeah, *****, I said what I said\nI'd rather be famous instead\nI let all that get to my head\nI don't care, I paint the town red\n*****, I said what I said\nI'd rather be famous instead\nI let all that get to my head"
        
        # WHATS POPPIN by Jack Harlow
        elif song['spotify_id'] == '1jaTQ3nqY3oAAYyCTbIvnM':
            song['chorus'] = "What's poppin'? \nBrand new whip, just hopped in \nI got options \nI could pass that ***** like Stockton \nJust joshin'\nI'ma spend this holiday locked in \nMy body got rid of them toxins \nSportsCenter, top ten"
        
        # Busy Woman by Sabrina Carpenter
        elif song['spotify_id'] == '0b0Dz0Gi86SVdBxYeiQcCP':
            song['chorus'] = "But if you need my love\nMy clothes are off, I'm comin' over to your place\nAnd if you don't need  my love\nWell, I didn't want your little *****-*** anyway\nYeah, I'm a busy woman\nI wouldn't let you come into my calendar any night"
    
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
    
    # Apply manual censoring for specific problematic songs
    censored_data = manual_censor_specific_songs(censored_data)
    
    # Save censored data to gameData.json
    save_json_file(censored_data_path, censored_data)
    
    print(f"Censored {len(banned_words)} banned words in {len(uncensored_data)} songs.")
    print(f"Saved censored data to {censored_data_path}")

if __name__ == "__main__":
    main() 