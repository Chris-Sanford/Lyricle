# Tests

This document describes the test processes/flows that must be executed in order to verify desired behavior and detect regressions. Ideally, we can automate all or most of these flows.

# Features to Test

The below are the features to test in isolation, as opposed to full flows that need to be tested sequentially. Perhaps these we can test automatically but flows might need to be executed manually once we've confirmed the feature we're working on is working as intended.

BE SURE TO TEST ALL OF THESE ON BOTH DESKTOP AND MOBILE. And ideally, multiple browsers.

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

It is critical that input events both from a native keyboard and the on-screen keyboard give the same experience, BOTH on desktop and mobile. For example, both the native and OSKB should ensure that, when a lyric is completed, the next lyric is focused and the insertion point is set at the end of the text content.

## Game Completion

- Song preview plays upon game completion, assuming audio is enabled/unmuted
- `Disable/Mute` and `Enable/Unmute` audio buttons successfully alter audio playback
- The Game Completion button appears in the top left and the modal is dismissable and re-openable

## On-Screen Keyboard

- Every button in the on-screen keyboard works both on desktop and mobile