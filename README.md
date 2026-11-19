# Realevate — arrival animation

Recreation of the supplied landing page animation. The interaction was implemented from a supplied reference video. This public edition uses a new original architectural triptych generated for the project with OpenAI ImageGen in November 2026. Its panels depict a fictional seaside terrace, a terracotta tower at dusk and an olive-tree courtyard. Each panel was cropped and encoded locally for the animation. Intended as a visual demonstration, with no real estate or contact service.

## Files

- `dist/index.html`: landing page and accessible dialogs.
- `dist/styles.css`: composition, responsive rules and reduced-motion fallback.
- `dist/arrival.js`: arrival sequence, rolling counter, marquee and replay.
- `dist/assets/`: three original, locally served architectural illustrations.

Static HTML, CSS and JavaScript; no build or third-party runtime dependencies. Serve `dist/` through any static HTTP server. The footer menu lets visitors replay the arrival.

## Arrival timeline

The supplied recording starts with loading already in progress. The arrival is extended by a shared `arrivalPace` factor of 1.6, preserving the original choreography. The recreation starts at 76 and rolls to 100 over 1.76 seconds. Two photographs expand over the initial courtyard photograph. At 1.888 seconds the blue curtain rises and the photograph moves from 50% to 40.7% of the hero height. Navigation, copy and the headline then reveal. The sequence finishes at 3.744 seconds and the headline continues moving at 34 pixels per second. This factor applies only to the arrival, including its completion timer and counter, and does not affect the continuous headline motion.

Reduced-motion preferences show the completed composition immediately and disable the moving headline. Replay cancels the previous sequence before starting another. Navigation opens locally implemented dialogs; no personal data is collected. The landing container deliberately does not create a stacking context: its photograph at z-index 6 must remain above the sibling intro curtain at z-index 5, including during the initial photo sequence.

## Verification

JavaScript syntax, HTML references and static assets were checked. The current environment has no supported browser-control skill, so visual browser verification was unavailable.
