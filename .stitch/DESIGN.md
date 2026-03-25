# Design System: ft-100 App
**Project ID:** 5845193665385997421

## 1. Visual Theme & Atmosphere
A competitive, engaging, and high-stakes atmosphere for a real-time, 2-player turn-based game. Designed as **Mobile-First**, the layout prioritizes one-handed usability, large touch targets, and clear visual feedback for turn states (e.g., "Your Turn" vs. "Waiting"). It balances a deep midnight arena with vibrant gold accents to create a premium, arcade-like experience.

## 2. Color Palette & Roles
- **Deep Midnight Blue** (#0A192F): Primary background, creating a dark, immersive game arena.
- **Rich Navy Surface** (#112240): Elevated surfaces like player stat cards and game board tiles.
- **Vibrant Gold Accent** (#D4AF37): Primary action color for the active player's turn, winning states, and crucial interactive elements.
- **Opponent Crimson** (#E63946): Secondary accent color to clearly distinguish the opponent's pieces, health, or turn from the local player's elements.
- **Soft Gold Glow** (#F3E5AB): Used for subtle glowing borders when an action is selected or available.
- **Crisp Slate Gray** (#F8FAFC): Primary text color for player names, scores, and clear UI text.
- **Muted Blue-Gray** (#8892B0): Secondary text for timestamps, game history, or inactive states.

## 3. Typography Rules
- **Headers/Scores:** Bold, high-impact, geometric sans-serif (e.g., 'Outfit', 'Inter') for large numerals and prominent vs. matchups.
- **Body:** Highly readable, compact sans-serif for chat and game logs.
- **Accents:** Uppercase with wide letter-spacing for game states (e.g., "YOUR TURN", "VICTORY").

## 4. Component Stylings
- **Buttons (Mobile-First):** Full-width or large pill-shaped (fully rounded) buttons at the bottom of the screen (thumb-zone reachable). Bright gold fill for active actions.
- **Player Cards:** Subtly rounded (12px), Rich Navy surface. Active player card receives a vibrant gold glow or border to indicate whose turn it is.
- **Game Board/Play Area:** Centralized mobile grid, sharp inner borders to separate spaces, and subtle diffused shadow around the arena to pop against the background.

## 5. Layout Principles
- **Mobile-First Ergonomics:** Critical interactions and primary CTAs are placed in the bottom third of the screen.
- **Vertical Hierarchy:** Opponent info at the top, game arena in the middle, local player info and actions at the bottom.
- **Animations (Implied):** Micro-interactions on turns passing, timers ticking down, and actions resolving.
