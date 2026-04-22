import { useApp } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

export default function SyncStatusOverlay() {
  const { isInitialSyncComplete } = useApp();

  // Don't show if initial sync is complete
  if (isInitialSyncComplete) return null;

  return (
    <div className="sync-overlay">
      <div className="sync-content">
        <Loader2 className="sync-spinner" size={48} />
        <h2>Menyinkronkan Data</h2>
        <p>Mengambil data terbaru dari cloud...</p>
        <p className="sync-hint"> Ini hanya diperlukan sekali saat pertama kali membuka aplikasi.</p>
      </div>
    </div>
  );
}
