import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  List,
  Wallet,
  PiggyBank,
  CreditCard,
  Repeat,
  Settings,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions',   icon: List,            label: 'Transaksi' },
  { path: '/budget',         icon: Wallet,          label: 'Budget' },
  { path: '/assets-savings', icon: PiggyBank,       label: 'Aset & Tabungan' },
  { path: '/debts',          icon: CreditCard,      label: 'Utang' },
  { path: '/recurring',      icon: Repeat,          label: 'Tagihan' },
  { path: '/settings',       icon: Settings,        label: 'Pengaturan' },
];

/* Items shown in bottom nav (mobile) — max 5 slots */
const bottomNavItems = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: List,            label: 'Transaksi' },
  { path: '/budget',       icon: Wallet,          label: 'Budget' },
  { path: '/recurring',    icon: Repeat,          label: 'Tagihan' },
  { path: '/settings',     icon: Settings,        label: 'Lainnya' },
];

export default function Sidebar() {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon"><item.icon size={18} /></span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Mobile bottom navigation ─────────────────────── */}
      <nav className="bottom-nav" role="navigation" aria-label="Navigasi utama">
        {bottomNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className="bottom-nav-icon">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span className="bottom-nav-label">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}