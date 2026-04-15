import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
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
      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <ul className="mobile-nav-list">
          <li><a href="/" className="mobile-nav-item">🏠<span>Home</span></a></li>
          <li><a href="/transactions" className="mobile-nav-item">💵<span>Transaksi</span></a></li>
          <li><a href="/budget" className="mobile-nav-item">📊<span>Budget</span></a></li>
          <li><a href="/settings" className="mobile-nav-item">⚙️<span>Setting</span></a></li>
        </ul>
      </nav>
    </div>
  );
}
