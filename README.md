# Virtual Cosmos

A 2D virtual office where users move around and chat with nearby players in real time.

## Deployed site and demo video

[Live Deployed site](https://virtual-office-nmfs.onrender.com/) and 
[Video link](https://canva.link/x5tzjghzu5690xp)

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

## Architecture

<img width="1172" height="903" alt="arch" src="https://github.com/user-attachments/assets/165dd28b-6cb3-4f4e-b243-5a07f0c61132" />


The server runs a **20Hz game loop** (50ms tick) that broadcasts the full world state to all clients and runs the proximity engine each tick. All movement is validated server-side before being applied to the in-memory world state. MongoDB is used only for user sessions; all positional and chat state is in-memory.

---

## Design Decisions

**State authority: hybrid model**
The client sends its position, the server validates bounds and speed, then rebroadcasts. The server is authoritative for proximity, rooms, and chat. Movement stays responsive for the local player while the server prevents cheating everywhere it matters.

**World state in memory, not the database**
All player positions are stored in a `Map` on the server. Position updates at 20Hz would overwhelm MongoDB with writes, so the DB is used only to log user join and leave events for sessions.

**Batched tick-based broadcasting**
The server collects all position updates and broadcasts a single `world:state` snapshot per 20Hz tick via `setInterval`. Individual moves are not rebroadcast immediately. This keeps network traffic predictable and low.

**Proximity detection with hysteresis**
Proximity runs server-side each tick. Players connect when distance drops below 150px and disconnect only when it exceeds 195px (1.3x the connect radius). The gap prevents the chat panel from flickering when two players hover near the boundary. Union-find groups connected pairs into clusters, so if A is near B and B is near C, all three share one chat room.

**Stable room IDs**
`stableRoomId = [...members].sort().join('-')`. Sorting before joining means the same group of players always gets the same room ID regardless of who joined first. Chat history is kept in memory and not deleted when a room dissolves, so history survives brief separations.

**Chat routing via server-derived room membership**
The client sends message text only. The server looks up which room the sender belongs to and broadcasts via `io.to(roomId)`. Messages carry monotonic IDs for ordering and client-side deduplication. Full history is synced to a player when they join a room.

**Movement validation on both sides**
The client applies collision locally for instant feedback. The server independently validates every move: speed cap check (squared distance, no `sqrt`), bounds clamp to `MAP_BOUNDS`, and circle-vs-AABB collision against all obstacle rectangles (`PLAYER_RADIUS = 24`). Invalid positions are silently dropped. Each socket is also rate-limited to one move per 30ms.

**Map and collision as a single source of truth**
The background is an authored image. Collision rectangles are defined separately in `mapData.js` and served via `/api/map`. Both client and server import from the same data, so visual layout and game logic can never diverge.

**Client rendering at 60fps from 20Hz updates**
Remote player positions are lerped toward the latest server snapshot each frame (factor 0.15), giving smooth motion without waiting for the next tick. The local player is set directly with no lerp. All sprite sheets are pre-loaded and `PIXI.AnimatedSprite` objects for all three states (idle, walk, run) are created once per player and toggled by visibility, avoiding GPU churn. `NEAREST` scale mode is used for pixel art crispness.

**Networking split between REST and Socket.IO**
Map data and user join use REST. All real-time events (positions, proximity, chat) use Socket.IO. The client throttles position emits to 50ms and discards stale tick snapshots on arrival to handle out-of-order delivery.

**Reconnection is idempotent**
Socket.IO auto-reconnects. On reconnect, the client re-emits `user:join`. The server join handler cleans up any existing state for that user before registering them again, so duplicate state never accumulates.

**AFK detection via batch diffs**
The server tracks `lastActive` per user and checks every 10 seconds. It only emits a `status:batch` event when statuses have actually changed, not on every interval, keeping idle broadcasts to zero.

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
