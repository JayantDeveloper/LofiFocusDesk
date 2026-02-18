# LofiFocusDesk

An immersive 3D focus room built with React + Three.js.  
LofiFocusDesk combines a cozy interactive workspace with a to-do board, pomodoro timer, music toggle, embedded calendar, and live focus/task scoring.

Live app: [https://lofifocusdesk.vercel.app/](https://lofifocusdesk.vercel.app/)

## What It Does

- Renders a stylized 3D desk/room scene with interactive objects.
- Provides a full to-do workflow (add/edit/check/reorder/delete completed tasks).
- Includes a pomodoro timer (Focus/Break) with a soft completion ring.
- Displays an embedded Google Calendar in an in-app popup.
- Lets you toggle lofi music from the radio (YouTube embed loop).
- Runs a continuous in-game day/night cycle with:
  - sun/moon swapping
  - smooth sky transitions
  - interior lighting shifts
  - window/building light behavior tied to time
- Shows score tiles near the calendar:
  - Focus Score
  - Task Score
- Opens a compact stats card (bottom-right) when score tiles are clicked.
- Dynamically updates favicon + tab title by in-game time.

## Controls

Keyboard:
- `T` Toggle To-Do popup (same interaction as clicking the plant)
- `C` Toggle Calendar popup (same interaction as clicking the wall calendar)
- `R` Toggle Music (same interaction as clicking the radio)

Mouse / Pointer:
- Drag to look around (seated camera limits)
- Click plant -> To-Do popup
- Click radio -> Music toggle
- Click wall calendar -> Calendar popup
- Click focus/task score tiles -> Stats card

## Core Features

### 1) 3D Focus Room

- Built with `@react-three/fiber` + `three`.
- Includes desk assets (lamp, clock, radio, notebook, plant, etc.).
- Procedural textures are generated at runtime via canvas.
- External city/building shell includes dynamic windows and atmospheric sunlight rays.

### 2) Day/Night + Environment Simulation

- In-game world time progresses continuously.
- Sky, fog, ambient, hemisphere, sun, moon, glass tint, and building window glow are all time-reactive.
- Day/night icon switching is reflected in favicon:
  - day icon from `06:00` to `17:59`
  - night icon from `18:00` to `05:59`

### 3) To-Do Board

- Task fields:
  - title
  - difficulty (`Easy`, `Medium`, `Hard`)
  - done checkbox
- Drag-and-drop task reordering.
- “Done With Task” action removes checked items.
- Selection counter appears when at least one task is selected.
- Stored in localStorage (`focusdesk-board-todo-items`).

### 4) Pomodoro Timer

- Focus mode: 25:00
- Break mode: 05:00
- Start/Pause, Reset, and mode switching.
- Soft completion ring sound on cycle completion.
- Completed focus sessions tracked and persisted in localStorage (`focusdesk-pomodoro-focus-sessions`).

### 5) Focus & Task Scoring

- `Task Score`: percent of completed tasks.
- `Focus Score`: derived from completed focus sessions + current focus-cycle progress + active run state.
- Scores are shown on wall tiles and in the stats card.

### 6) Calendar + Music Integrations

- Google Calendar embed in popup panel.
- YouTube lofi player hidden in DOM, controlled via app state (autoplay + loop).

## Tech Stack

- React 19
- Vite 7
- Three.js (`three`)
- React Three Fiber (`@react-three/fiber`)
- Drei (`@react-three/drei`)
- ESLint 9

## Project Structure

```text
src/
  App.jsx
  App.css
  components/
    FocusRoomHud.jsx
    FocusRoomPopup.jsx
    FocusStatsCard.jsx
    GoogleCalendar.jsx
    RoomMusicPlayer.jsx
    WelcomeOverlay.jsx
    WelcomeOverlay.css
  focus-room/
    FocusRoomScene.jsx
    useFocusTextures.js
    components/
      RoomShell.jsx
      DeskSetup.jsx
      WallDecor.jsx
      SeatedCameraControls.jsx
      Css3DLayer.jsx
      desk-assets/
        AlarmClock.jsx
        DeskFrame.jsx
        DeskLamp.jsx
        DeskRadio.jsx
        Notebook.jsx
        Plant.jsx
        PenCup.jsx
        StickyNoteStack.jsx
        ...
    todo-board/
      FocusTodoBoardApp.jsx
      FocusTodoBoardApp.css
      constants.js
      hooks/
        useBoardTodoItems.js
        useBoardPomodoroState.js
      components/
        BoardItem.jsx
        BoardPomodoro.jsx
public/
  lofideskiconday.png
  lofideskiconnight.png
```

## Local Development

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
npm run preview
```

## Configuration Guide

### Change Google Calendar

File: `src/components/GoogleCalendar.jsx`

- Replace the `src` URL with your own Google Calendar embed link.

### Change Music Track

File: `src/components/RoomMusicPlayer.jsx`

- Update `MUSIC_VIDEO_ID` to a different YouTube video ID.

### Change Keybind Labels

File: `src/components/FocusRoomHud.jsx`

- Edit `HUD_BINDS`.

### Change Day/Night Cycle Speed

File: `src/focus-room/FocusRoomScene.jsx`

- `WORLD_DAY_CYCLE_SECONDS` controls how long a full in-game 24-hour cycle takes.

### Change Favicon Switching Assets

Files:
- `public/lofideskiconday.png`
- `public/lofideskiconnight.png`
- `src/App.jsx` (`DAY_ICON_PATH`, `NIGHT_ICON_PATH`)

## Persistence

Current localStorage keys:

- `focusdesk-board-todo-items` (task list data)
- `focusdesk-pomodoro-focus-sessions` (completed focus session count)

## Deployment

This project is Vite-compatible and deploys cleanly to Vercel.

Typical flow:

1. Push to GitHub.
2. Import repository in Vercel.
3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

## Notes

- App is currently single-page and client-side only.
- No backend/database is required; user data is stored locally in browser storage.
- If large chunk warnings appear during build, consider code-splitting for heavier scene/UI modules.

## License

No license file is currently defined in this repository.  
Add a `LICENSE` if you want explicit usage terms.
