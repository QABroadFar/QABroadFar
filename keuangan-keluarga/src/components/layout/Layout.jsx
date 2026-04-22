import { Outlet, Link } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import SyncStatusOverlay from '../SyncStatusOverlay';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <SyncStatusOverlay />
    </div>
  );
}
