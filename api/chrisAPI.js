import { get } from 'axios';

const getLyrics = async () => {
    const url = 'https://api.musixmatch.com/ws/1.1';
    const apiKey = '';
    const trackName = 'All Together Now';
    const artistName = 'The Beatles';

    try {
        const response = await get(`${url}/matcher.lyrics.get`, {
            params: {
                q_track: trackName,
                q_artist: artistName,
                apikey: apiKey,
                format: 'json',
                callback: 'callback'
            }
        });

        if (response.data.message.body.lyrics) {
            console.log(response.data.message.body.lyrics.lyrics_body);
        } else {
            console.log('No lyrics found for this track.');
        }
    } catch (error) {
        console.error(error);
    }
};

getLyrics();
