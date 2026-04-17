import { Outlet, Link } from 'react-router-dom';
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
          <li><Link to="/" className="mobile-nav-item">🏠<span>Home</span></Link></li>
          <li><Link to="/transactions" className="mobile-nav-item">💵<span>Transaksi</span></Link></li>
          <li><Link to="/budget" className="mobile-nav-item">📊<span>Budget</span></Link></li>
          <li><Link to="/settings" className="mobile-nav-item">⚙️<span>Setting</span></Link></li>
        </ul>
      </nav>
    </div>
  );
}
