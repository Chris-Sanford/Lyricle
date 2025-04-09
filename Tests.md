# Tests

This document describes the test processes/flows that must be executed in order to verify desired behavior and detect regressions. Ideally, we can automate all or most of these flows.

# Features to Test

The below are the features to test in isolation, as opposed to full flows that need to be tested sequentially. Perhaps these we can test automatically but flows might need to be executed manually once we've confirmed the feature we're working on is working as intended.

## Startup

- Clicking `Play`, `X`, or outside of the `How To Play` modal dismisses the modal

## Top / Navigation Bar

- Clicking `(?)` button opens the `How To Play` modal
- `Disable/Mute` and `Enable/Unmute` audio buttons and functionality visually respond
- Clicking the `Random / Dice` button serves a new song

## Lyric Guessing Experience

- Upon initial game load, the first unfinished lyric is selected and the underline is highlighted in blue and focused
- Incorrect, unmatching inputs do not decrease opacity or increase transparency
- Correct, matching inputs does decrease opacity and increases transparency
- Upon successful completion of a lyric guess, the next unfinished lyric is focused
- Upon focusing of a lyric input box, the cursor insertion point is set to the end of the current text content

## Game Completion

- `Disable/Mute` and `Enable/Unmute` audio buttons successfully alter audio playback