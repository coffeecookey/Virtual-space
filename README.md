# Virtual Cosmos

A 2D virtual office where users move around and chat with nearby players in real time.

## Live Demo

[Add deployed URL here]

## Demo Video

[Add video link here]

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

## Architecture

<img width="1161" height="891" alt="arch" src="https://github.com/user-attachments/assets/3e2b56ca-7ac1-4eea-bb6c-59d4a030c539" />


The server runs a **20Hz game loop** (50ms tick) that broadcasts the full world state to all clients and runs the proximity engine each tick. All movement is validated server-side before being applied to the in-memory world state. MongoDB is used only for user sessions; all positional and chat state is in-memory.

---

## Design Decisions

**Squared distance comparisons throughout**
All proximity checks use `dx*dx + dy*dy` and compare against pre-squared thresholds (`150²`, `195²`). Avoids `Math.sqrt` on every pair check every tick.

**Hysteresis band on proximity (150px connect / 195px disconnect)**
The connect and disconnect thresholds are different. Once two players are connected, they stay connected until the larger threshold is exceeded. Without this, players hovering at the boundary would cause the chat panel to flicker open and closed on every tick.

**Union-Find for proximity grouping**
Nearby pairs are unioned with a path-compressed, rank-based union-find each tick. This correctly handles transitive proximity (A near B, B near C → all three in one chat) in O(n²·α(n)) time, where α is effectively constant.

**Stable room IDs from sorted member arrays**
`stableRoomId = [...members].sort().join('-')`. Sorting before joining means the same set of players always produces the same room ID regardless of join order. This allows chat history to persist when the group briefly fragments and re-forms.

**Chat history copy on group merge**
When a new proximity group forms that includes members from different prior groups, history is copied from all previous rooms into the new room ID. The history buffer is capped at 50 messages per room, with an LRU-style eviction cap of 100 rooms in memory.

**Server-side AABB circle collision**
The movement handler tests each incoming position against all obstacle rectangles using a circle-vs-AABB nearest-point check (`PLAYER_RADIUS = 24`). Invalid positions are dropped silently — the client is never told the move was rejected; it simply doesn't see itself move in the next world broadcast.

**Rate-limiting and teleport detection on movement**
Each socket's moves are throttled to one per 30ms. If the claimed displacement in a single move exceeds `MAX_SPEED × 6`, the position is clamped to map bounds and accepted (not rejected) — a soft correction that handles legitimate lag spikes without kicking the player.

**Pre-built AnimatedSprites at load time**
`SpriteLoader.preloadAll()` slices all three spritesheets and constructs `PIXI.AnimatedSprite` objects for all avatar/state combinations before the game starts. The `Player` constructor receives already-built texture arrays. Avoids repeated texture lookups and GC pressure from creating sprite objects during gameplay.

**Client-side lerp for remote players (factor 0.15)**
Remote player positions are interpolated toward the server-authoritative target each frame. The local player's position is set directly (no lerp) since it originates the movement. Lerp factor of 0.15 gives smooth visual motion without introducing noticeable lag.

**Label on outer container, sprite on inner container**
Each `Player` has a `_spriteContainer` inside its main `container`. Flipping direction sets `_spriteContainer.scale.x = ±1`. The name label is attached to the outer container and therefore never flips.

**AFK detection with batch diff broadcasting**
`StatusManager` tracks last activity per user and checks every 10 seconds. It only emits `status:batch` when statuses actually changed — not every interval — to avoid redundant broadcasts to all clients.

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

---

## License

MIT
