import { useApp } from '../../context/AppContext';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import './Header.css';

export default function Header() {
  const { selectedPeriod, setSelectedPeriod } = useApp();

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return { value: i + 1, label: format(date, 'MMMM', { locale: localeId }) };
  });

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year, label: year.toString() };
  });

  const handlePeriodChange = (type, value) => {
    setSelectedPeriod(prev => ({ ...prev, [type]: parseInt(value) }));
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">💰</span>
          <h1>Keuangan Keluarga</h1>
        </div>
      </div>
      <div className="header-center">
        <div className="period-selector">
          <Calendar size={18} />
          <select
            value={selectedPeriod.month}
            onChange={e => handlePeriodChange('month', e.target.value)}
            className="period-select"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedPeriod.year}
            onChange={e => handlePeriodChange('year', e.target.value)}
            className="period-select"
          >
            {years.map(y => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="header-right">
        <div className="user-profile">
          <div className="user-avatar" style={{ background: 'var(--primary)' }}>
            K
          </div>
          <span className="user-label">Keluarga</span>
        </div>
      </div>
    </header>
  );
}
