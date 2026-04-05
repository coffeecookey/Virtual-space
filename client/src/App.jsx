import GameCanvas from './components/GameCanvas';
import ChatPanel from './components/ChatPanel';
import UserPanel from './components/UserPanel';
import LocationBar from './components/LocationBar';

export default function App() {
  return (
    <>
      <GameCanvas playerName="TestPlayer" />
      <UserPanel />
      <ChatPanel />
      <LocationBar />
    </>
  );
}
