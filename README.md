# Virtual Cosmos

A 2D virtual office where users move around and chat with nearby players in real time.

## Deployed site and demo video

[Live Deployed site](https://virtual-office-nmfs.onrender.com/) and 
[Video link](https://canva.link/x5tzjghzu5690xp)

---
## Architecture

<img width="1172" height="903" alt="arch" src="https://github.com/user-attachments/assets/165dd28b-6cb3-4f4e-b243-5a07f0c61132" />

The server runs a **20Hz game loop** (50ms tick) that broadcasts the full world state to all clients and runs the proximity engine each tick. All movement is validated server-side before being applied to the in-memory world state. MongoDB is used only for user sessions; all positional and chat state is in-memory.

---
## Some screenshots!
<img width="786" height="550" alt="Screenshot 2026-04-07 at 22 21 02" src="https://github.com/user-attachments/assets/23081390-1a70-40c8-bdeb-54f2aa54680d" />

<img width="790" height="557" alt="Screenshot 2026-04-07 at 22 21 24" src="https://github.com/user-attachments/assets/8278b9f8-837d-4b77-8c19-a8770fb8952a" />

---

## Features

- **Real-time multiplayer movement** — WASD, arrow keys, or click-to-move
- **Proximity-based chat** — auto-connects when players are close, disconnects when they move apart
- **Animated character sprites** — 3 avatar choices with idle/walk/run animations
- **Room-based map** — authored 2000×1500px map with per-object AABB collision rectangles
- **User presence panel** — Discord-style sidebar, grouped by room
- **AFK detection** — marks idle players after 60 seconds
- **Location indicator** — shows current room name
- **Help overlay** — in-app controls reference

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), PixiJS 7, Tailwind CSS, Zustand |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB (sessions only) |

---

## Design Decisions

- **World State Stored in Memory**  
  Player positions live in a server `Map`; MongoDB only logs user session joins/leaves to avoid high-frequency database writes.

- **Batched Tick-Based Broadcasting**  
  Server collects movement updates and emits a single `world:state` snapshot at **20Hz**, keeping network traffic predictable.

- **Proximity Detection with Hysteresis**  
  Players connect below **150px** and disconnect above **195px**, preventing chat flicker near distance boundaries.

- **Proximity Grouping via Union-Find**  
  Nearby players form clusters using union-find, so **A–B** and **B–C** automatically become a shared group `{A,B,C}`.

- **Stable Room IDs**  
  Room IDs are derived from sorted member IDs (`A-B-C`) so the same group always maps to the same room.

- **Server-Derived Chat Routing**  
  Clients send only message text; the server resolves the sender’s room and broadcasts via `io.to(roomId)`.

- **Monotonic Chat Message IDs**  
  Each message carries an increasing ID for ordering and client-side deduplication.

- **Chat History Sync on Join**  
  When a user enters a room, the server sends the full chat history so conversations feel continuous.

- **Chat History Bounded in Memory**  
  Each room stores up to **50 messages** and the server stores **100 rooms max**, evicting the oldest room via `Map` LRU order.

- **Chat History Preserved on Group Merge**  
  When groups merge (`A–B + C → A–B–C`), previous room histories are merged so messages are never lost.

- **Movement Validation on Both Client and Server**  
  Client performs local collision for responsiveness; server revalidates speed, bounds, and obstacle collisions.

- **Efficient Movement Validation**  
  Speed checks use **squared distance** (no `sqrt`) and sockets are rate-limited to **one move per 30ms**.

- **Map and Collision Share One Source of Truth**  
  Collision rectangles live in `mapData.js` and are served to both client and server via `/api/map`.

- **Client Rendering at 60fps from 20Hz Updates**  
  Remote players **lerp toward server positions** each frame for smooth motion between network ticks.

- **Local Player Rendered Without Interpolation**  
  The local player position is set directly to maintain instant responsiveness.

- **Sprite Assets Preloaded**  
  All sprite sheets load before joining so avatars appear immediately without missing textures.

- **AnimatedSprite Reuse for Performance**  
  Idle/walk/run sprites are created once per player and toggled via visibility to avoid GPU churn.

- **Pixel-Art Rendering Settings**  
  Pixi uses **NEAREST scale mode** so pixel art stays crisp during scaling.

- **Networking Split Between REST and Sockets**  
  Static data (map/config) uses **REST** while real-time events use **Socket.IO**.

- **Client-Side Movement Throttling**  
  Movement emits are throttled to **50ms** to prevent network flooding.

- **Stale Tick Protection**  
  Clients discard out-of-order world snapshots using **tick IDs**.

- **Reconnection is Idempotent**  
  On reconnect the client re-emits `user:join`, and the server cleans up any previous state.

- **AFK Detection via Batched Diffs**  
  Server checks activity every **10s** and emits `status:batch` only when statuses actually change.

- **Avatar Selection Validated Server-Side**  
  Server whitelist-checks `avatarId` and falls back to a default if the client sends an invalid value.

- **Dual-Input Movement Support**  
  Players can move via **WASD/arrow keys** or **click-to-move**, with keyboard input canceling click targets.

- **Movement Disabled While Typing**  
  Movement keys are cleared when an `input` or `textarea` is focused so players don’t walk while chatting.

- **Player Fade-Out on Disconnect**  
  Remote avatars fade out (`alpha -= 0.04`) before being removed from the stage.

- **Location Rooms Derived from Coordinates**  
  Server maps player coordinates to named areas (**lobby, meeting, lounge**) and emits `location:update`.

- **Spawn Position is Fixed and Room-Aware**  
  Players spawn at `{x:480, y:600}` in the **lobby** and receive location updates immediately on join.

- **Sprite Flipping Preserves Readable Labels**  
  Only the sprite sub-container flips horizontally so player names remain readable.

- **Retina Rendering Support**  
  Pixi uses `devicePixelRatio` with `autoDensity` for sharp rendering on **HiDPI displays**.

- **Camera Keeps Player Centered**  
  Camera translates the stage so the player remains centered in the viewport during movement.

- **Camera Updates on Window Resize**  
  A resize listener reapplies camera transforms so centering remains correct.

- **Hot-Reload Safe Join Guard**  
  A `hasJoined` flag prevents duplicate `user:join` emits during development hot reload.

---

## Setup & Run

### Prerequisites

- Node.js 18+
- MongoDB running locally or an Atlas URI

### Installation

```bash
git clone https://github.com/your-username/virtual-cosmos.git
cd virtual-cosmos
```

**Server**

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/virtualcosmos
CLIENT_URL=http://localhost:5173
```

**Client**

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
```

### Run

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
virtual-cosmos/
├── client/
│   └── src/
│       ├── components/     # React UI (ChatPanel, UserPanel, LocationBar, HelpModal)
│       ├── core/           # PixiJS setup, InputHandler, Camera, MapLoader, SpriteLoader
│       ├── entities/       # Player (sprites, lerp, label)
│       ├── network/        # SocketClient (Socket.IO)
│       └── state/          # Zustand store
└── server/
    └── src/
        ├── config/         # constants.js (TICK_RATE, MAP_BOUNDS, MAX_SPEED)
        ├── handlers/       # movementHandler, chatHandler, userHandler
        ├── managers/       # ProximityEngine, RoomManager, ChatManager,
        │                   # WorldStateManager, StatusManager, ConnectionManager
        ├── models/         # Mongoose User schema
        ├── world/          # mapData.js (room bounds + obstacle rectangles)
        └── GameLoop.js     # 20Hz tick
```
