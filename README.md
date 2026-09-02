# Rubik's Cube Timer

A focused, responsive 3×3 cube timer built around the core solving flow: read a scramble, inspect the resulting cube state, and time a solve without interface clutter.

**Live demo:** [rubiks-cube-timer.com](https://rubiks-cube-timer.com)

## Highlights

- Generates 19–22 move scrambles using standard `U`, `D`, `L`, `R`, `F`, and `B` notation with prime and double turns.
- Simulates every move and renders the resulting six-face cube net, with yellow up, white down, and orange front.
- Uses a deliberate 0.5-second hold state: red while preparing, green when ready, and start on release.
- Supports keyboard, mouse, trackpad, and touch input with instructions adapted to the primary pointer type.
- Keeps the interface responsive and intentionally limited to the essential 3×3 timing experience.

## Controls

| Device      | Start                                                       | Stop                            |
| ----------- | ----------------------------------------------------------- | ------------------------------- |
| Computer    | Hold `Space` or press and hold anywhere; release when green | Press `Space` or click anywhere |
| Touchscreen | Touch and hold anywhere; release when green                 | Tap anywhere                    |

Releasing before the timer turns green cancels the start.

## Technology

- TypeScript
- React 19
- Vite
- CSS
- Provider-independent static deployment

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run dev       # Start the development server
npm run lint      # Run the linter
npm run build     # Create a production build
npm run start     # Preview the production build locally
```

## Version 1.0 scope

This release intentionally focuses on the core 3×3 timer. Accounts, saved solves, averages, and additional puzzle types are outside the current scope.
