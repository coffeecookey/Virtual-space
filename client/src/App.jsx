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
  const [name, setName]   = useState(null);
  const [ready, setReady] = useState(false);

  if (!name) return <NamePrompt onSubmit={setName} />;

  return (
    <>
      {!ready && <LoadingScreen />}
      <GameCanvas playerName={name} onReady={() => setReady(true)} hidden={!ready} />
      {ready && <>
        <UserPanel />
        <ChatPanel />
        <LocationBar />
        <HelpModal />
        <Toast />
      </>}
    </>
  );
}
