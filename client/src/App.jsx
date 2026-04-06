import { useState } from 'react';
import NamePrompt from './components/NamePrompt';
import LoadingScreen from './components/LoadingScreen';
import GameCanvas from './components/GameCanvas';
import ChatPanel from './components/ChatPanel';
import UserPanel from './components/UserPanel';
import LocationBar from './components/LocationBar';
import HelpModal from './components/HelpModal';
import Toast from './components/Toast';

export default function App() {
  const [player, setPlayer] = useState(null);
  const [ready, setReady]   = useState(false);

  if (!player) return <NamePrompt onSubmit={(p) => { console.log('[App] player set:', p); setPlayer(p); }} />;

  return (
    <>
      {!ready && <LoadingScreen />}
      <GameCanvas playerName={player.name} avatarId={player.avatarId} onReady={() => setReady(true)} hidden={!ready} />
      {ready && <>
        <UserPanel />
        <LocationBar />
        <ChatPanel />
        <HelpModal />
        <Toast />
      </>}
    </>
  );
}
