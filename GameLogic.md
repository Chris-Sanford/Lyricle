# Game Logic

This document contains plain English descriptions of how the game functions and the core logic that drives the behavior. This is mostly to give context to an LLM when performing AI-assisted coding to prevent regressions.

# UI Display Logic

## How To Play Modal

Upon launch of Lyricle, you're greeted with the `How To Play` modal. This explains the general objective, instructions, and how the game is scored. To start playing, it can be dismissed in multiple intuitive ways, including clicking the `Play` button, the `X` close button, or outside of the modal.

## Lyricle Title and Control Bar

The top title/control bar is statically at the top and is designed to only take up the necessary amount of space to remain visible and easily-interactable.

In the horizontal middle of the top bar is the `Lyricle` site title. To the right is the audio control button (denoted by a `Speaker` icon that either indicates audio is enabled or disabled) and the `How To Play` button (denoted by `(?)`).

In debug mode, a `random` button (denoted by a pair of dice) is displayed to the left of the title/control bar.

# Random Button

When the user clicks the `random` button, the game generates a random seed within the range of the available indices from the `allSongData` array. It then chooses which song to start based on the randomly-generated seed/index.

# Audio

The Lyricle audio experience can be broken down into 2 components: `AudioControl` and `SongPlayback`.

`AudioControl` has two possible states: `Enabled` or `Disabled`. Their speaker button icons can be considered as representing `Unmuted` and `Muted` respectively, but in actuality, it's more accurate to consider it as `Song Playback is Allowed/Playable` and `Song Playback is Disallowed/NotPlayable`.

`SongPlayback` has two possible states: `Playing` and `NotPlaying`.

If the game has not yet been completed, `enabling AudioControl` will ensure that, once the game is complete, the song preview playback will begin.

`Disabling AudioControl` before the game is completed will prevent the song preview playback from starting. `Disabling AudioControl` after the game is completed, and thusly after the song preview playback has begun, will pause the song preview playback.

If `AudioControl` is `enabled` after the game has completed, then the song preview playback will resume if it had already begun before, or start from the beginning if it hasn't yet been started.

If the song preview ends after the game has completed, `enabling AudioControl` will restart playback of the song preview.

`Enabling` and `Disabling` `AudioControl` is possible by clicking the speaker icon either in the control bar or in the `Game Complete` modal. The icon on display represents the current state of the audio.

# Lifelines

Players are given 3 lifelines up front. The lifeline is usable through the dedicated on-screen keyboard button.

When a player uses a lifeline, the next correct LETTER (NOT CHARACTER, which means don't give punctuation for lifelines) is populated into all incomplete lyrics, with various caveats and behaviors:
- Lifelines do not affect already completed lyrics
- If the incomplete lyric has content already in it, it's replaced with the newly-given lifeline content
- The first lifeline gives only the first letter. The second lifeline gives the first 2 letters. The third lifeline gives the first 3 letters.
- Lifelines do not populate letters into lyrics that would otherwise be completed by usage of the lifeline.

For example:
- A singular lyric of `I` will not be affected by usage of a lifeline because it's a single letter
- A lyric of `me` will only ever be given `m` and will not be affected by subsequent usage of lifelines
- A lyric of `the` will be given only `th`, and not `e` since it would complete the lyric
- A lyric of `that` will be given `tha` which will exhaust all lifelines but not complete the lyric

# Game Completion

The game is completed once all lyrics have been successfully guessed, or the player concedes. The player concedes by clicking the broken heart button after utilizing all lifelines.

Once the game is completed, the `Game Complete` modal is launched with various statistics on the player's performance. If `AudioControl` is `enabled`, then the song preview plays.

# Conceding

The player is able to concede once they've exhausted all of their lifelines. Upon utilization of the final remaining lifeline, the lifeline heart icon is cracked and has a slight red tint to indicate a dangerous and irreversible action. The button is still clickable, but opens a modal that asks the player if they'd like to concede, reminding them that it will end the game. If the player concedes, the game is over and the game completion modal appears.

# Lyric Guessing Experience

## Keyboards

Desktop players can either type on their native hardware keyboard or use the on-screen keyboard to input lyric guesses. Mobile players will rely soley on the proprietary on-screen keyboard Lyricle provides to ensure a consistent gameplay experience without relying on their native system keyboard that has adverse affects on the viewport and thusly the overall game experience.

## Lyric Input Control Logic/Flow

When the player presses into the input field of an incomplete lyric, the underline color changes to blue to indicate that specific lyric is selected.

The transparency of the underline for each lyric is proportional to the percentage of completion of the individual lyric. If the lyric is 80% complete/correct, the underline opacity is 20%.

When a player selects an incomplete lyric that already has content in it, the cursor/insertion point always jumps to the end of the existing content in the lyric input box to ensure an intuitive flow for the lyric input experience.

The character length of the content of an incomplete lyric input box cannot exceed the character length of the content of the secret, correct lyric to guess. For example, if the secret lyric is `they`, then the maximum character length of the lyric input box is 4 characters. Any attempt to input characters beyond that limit is ignored, and the existing content of the input box prior to the out of bounds input attempt is kept. For example, if the box currently contains `howd`, any attempt to input additional content will be dropped. Players can select and delete the existing content to make space.