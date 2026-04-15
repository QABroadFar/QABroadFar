import {
  Utensils, Car, FileText, Heart, BookOpen, Gamepad2, ShoppingBag,
  PiggyBank, Briefcase, Store, Home, Phone, Wifi, Coffee, ShoppingCart,
  Gift, Music, Camera, Plane, Train, Bus, Zap, Droplets, Wind, Calendar,
  Clock, Star, Award, Bookmark, MoreHorizontal
} from 'lucide-react';

export const iconList = [
  'utensils', 'car', 'file-text', 'heart', 'book-open', 'gamepad-2', 'shopping-bag',
  'piggy-bank', 'briefcase', 'store', 'home', 'phone', 'wifi', 'coffee', 'shopping-cart',
  'gift', 'music', 'camera', 'plane', 'train', 'bus', 'zap', 'droplets', 'wind', 'calendar',
  'clock', 'star', 'award', 'bookmark', 'more-horizontal'
];

export const iconMap = {
  'utensils': Utensils, 'car': Car, 'file-text': FileText, 'heart': Heart,
  'book-open': BookOpen, 'gamepad-2': Gamepad2, 'shopping-bag': ShoppingBag,
  'piggy-bank': PiggyBank, 'briefcase': Briefcase, 'store': Store, 'home': Home,
  'phone': Phone, 'wifi': Wifi, 'coffee': Coffee, 'shopping-cart': ShoppingCart,
  'gift': Gift, 'music': Music, 'camera': Camera, 'plane': Plane, 'train': Train,
  'bus': Bus, 'zap': Zap, 'droplets': Droplets, 'wind': Wind, 'calendar': Calendar,
  'clock': Clock, 'star': Star, 'award': Award, 'bookmark': Bookmark,
  'more-horizontal': MoreHorizontal
};

export function getIconComponent(iconName) {
  return iconMap[iconName] || MoreHorizontal;
}

export default function IconPicker({ selectedIcon, onSelect, color = '#3b82f6' }) {
  return (
    <div className="icon-picker">
      {iconList.map(iconName => {
        const Icon = iconMap[iconName];
        const isSelected = selectedIcon === iconName;
        return (
          <button
            key={iconName}
            type="button"
            className={`icon-option ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(iconName)}
            style={{ background: isSelected ? color : 'var(--input-bg)' }}
          >
            <Icon size={18} color={isSelected ? 'white' : 'var(--text)'} />
          </button>
        );
      })}
    </div>
  );
}