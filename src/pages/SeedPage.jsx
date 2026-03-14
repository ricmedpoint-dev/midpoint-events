import { useState } from 'react';
import { seedAll } from '../firebase/seed';

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [logs, setLogs] = useState([]);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setLogs([]);
    
    // Override console.log temporarily to capture seed output
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };

    try {
      await seedAll();
      setDone(true);
    } catch (err) {
      setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      console.log = originalLog;
      setSeeding(false);
    }
  };

  return (
    <div className="seed-page">
      <h2>🌱 Seed Firestore</h2>
      <p>
        Click the button below to populate your Firestore database with initial data
        (highlights, events, exhibitors, about text).
      </p>
      <button
        className="seed-btn"
        onClick={handleSeed}
        disabled={seeding || done}
      >
        {seeding ? 'Seeding...' : done ? '✅ Done!' : 'Seed Database'}
      </button>
      {logs.length > 0 && (
        <div className="seed-log">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
