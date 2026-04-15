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
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: List, label: 'Transaksi' },
  { path: '/budget', icon: Wallet, label: 'Budget' },
  { path: '/assets-savings', icon: PiggyBank, label: 'Aset & Tabungan' },
  { path: '/debts', icon: CreditCard, label: 'Utang/Piutang' },
  { path: '/recurring', icon: Repeat, label: 'Tagihan Rutin' },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
