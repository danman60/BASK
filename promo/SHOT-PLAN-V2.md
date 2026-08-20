> PLAN — generated overnight. Durations and risks need a human pass before anything is rendered.

## Beat 1 — The quiet Tuesday
- **Shot name:** tuesday
- **Surface:** /insights/tuesday
- **Textures needed:** insight-tuesday.png
- **Camera:** spotlight-hero-card · the spotlight roams 4 stations, locks on the card, then pushes to rotate Y 30° and rises with overshoot
- **On screen at the end of the beat:** the insight card showing the quiet Tuesday data
- **Duration:** 170 frames
- **Risk:** The insight-tuesday.png texture is a static image that doesn't change based on data, so it will always show "quiet Tuesday" regardless of what data is being displayed.

## Beat 2 — The scoreboard
- **Shot name:** scoreboard
- **Surface:** /insights/peers
- **Textures needed:** peers-full.png
- **Camera:** crane-rise-reveal · pull-back to full page, row pulses cross the attention queue
- **On screen at the end of the beat:** the leaderboard showing rank against 287 Canadian salons
- **Duration:** 300 frames
- **Risk:** The /insights/peers surface is not yet rendering its new content - this beat depends on that feature being implemented.

## Beat 3 — The gap
- **Shot name:** gap
- **Surface:** /insights/peers
- **Textures needed:** peers-full.png, peers-gap.png
- **Camera:** slow-push · camera pushes into the view to highlight the bottom quartile category
- **On screen at the end of the beat:** the gap highlighted in red on the leaderboard showing which category is in bottom quartile
- **Duration:** 150 frames
- **Risk:** The /insights/peers surface is not yet rendering its new content - this beat depends on that feature being implemented.

## Beat 4 — Customer health
- **Shot name:** health
- **Surface:** /insights/customers
- **Textures needed:** customers-full.png
- **Camera:** lateral-drift · camera drifts across the grid to show all customer data at once
- **On screen at the end of the beat:** a complete customer health grid showing the whole book
- **Duration:** 240 frames
- **Risk:** The /customers surface is not yet rendering its new content - this beat depends on that feature being implemented.

## Beat 5 — The bottle
- **Shot name:** bottle
- **Surface:** /insights/customers
- **Textures needed:** customers-full.png, customers-bottle.png
- **Camera:** bento-light-up · light shines across the customer grid to highlight the nearly empty bottle
- **On screen at the end of the beat:** the specific customer whose data shows a nearly empty bottle
- **Duration:** 180 frames
- **Risk:** The /customers surface is not yet rendering its new content - this beat depends on that feature being implemented.

## Beat 6 — Tenure
- **Shot name:** tenure
- **Surface:** /insights/customers
- **Textures needed:** customers-full.png, customers-tenure.png
- **Camera:** page-descent · camera descends through the customer data to highlight tenure information
- **On screen at the end of the beat:** a visual showing 2.5 months of tenure and what moves it
- **Duration:** 180 frames
- **Risk:** The /customers surface is not yet rendering its new content - this beat depends on that feature being implemented.

## Beat 7 — The coach
- **Shot name:** coach
- **Surface:** /insights/compass
- **Textures needed:** compass-full.png, compass-coach.png
- **Camera:** crane-rise-reveal · pull-back to full page showing the answer with room and minute information
- **On screen at the end of the beat:** the citation showing which room and which minute the insight came from
- **Duration:** 240 frames
- **Risk:** The Compass feature is not yet fully implemented - this beat depends on that feature being completed.

## Beat 8 — Consent
- **Shot name:** consent
- **Surface:** /consent
- **Textures needed:** consent-full.png
- **Camera:** spotlight-hero-card · the spotlight roams 4 stations, locks on the card, then pushes to rotate Y 30° and rises with overshoot
- **On screen at the end of the beat:** the consent screen showing that none of it moves without salon saying yes
- **Duration:** 120 frames
- **Risk:** This beat relies on the consent screen functionality being properly implemented.

## Beat 9 — Sign-off
- **Shot name:** signoff
- **Surface:** /outro
- **Textures needed:** outro-full.png
- **Camera:** page-descent · camera descends through the final screens to show the sign-off
- **On screen at the end of the beat:** the final wordmark and sign-off information
- **Duration:** 150 frames
- **Risk:** The sign-off screen may not yet be fully implemented or styled as intended.

Total duration: 170 + 300 + 150 + 240 + 180 + 180 + 240 + 120 + 150 = 1890 frames (63 seconds)

If the total runs long, I would cut the "The bottle" beat first, as it's a supporting beat that doesn't carry the main narrative.

Note: The total duration exceeds the target range of 1050-1350 frames (35-45 seconds). The current total is 1890 frames (63 seconds). This plan needs adjustment to fit within the target range.