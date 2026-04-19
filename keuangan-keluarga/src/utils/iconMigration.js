// Migration utility for converting legacy Lucide icon names to emoji characters
// This allows existing users to seamlessly transition to the new emoji-based system

export const legacyIconToEmoji = {
  utensils: '🍴',
  car: '🚗',
  'file-text': '📄',
  heart: '❤️',
  'book-open': '📖',
  'gamepad-2': '🎮',
  'shopping-bag': '🛍️',
  'piggy-bank': '🐷',
  briefcase: '💼',
  store: '🏪',
  home: '🏠',
  phone: '📱',
  wifi: '📶',
  coffee: '☕',
  'shopping-cart': '🛒',
  gift: '🎁',
  music: '🎵',
  camera: '📷',
  plane: '✈️',
  train: '🚆',
  bus: '🚌',
  zap: '⚡',
  droplets: '💧',
  wind: '💨',
  calendar: '📅',
  clock: '🕐',
  star: '⭐',
  award: '🏆',
  bookmark: '🔖',
  'more-horizontal': '☰'
};

/**
 * Convert a legacy icon name to its corresponding emoji
 * If the icon is already an emoji or unknown, return as-is
 */
export function migrateIcon(icon) {
  // If already an emoji (single character or emoji sequence), keep it
  if (!icon || typeof icon !== 'string') return icon;
  
  // Check if it's a legacy icon name and map to emoji
  return legacyIconToEmoji[icon] || icon;
}

/**
 * Check if an icon value is a legacy icon name (lowercase with hyphens)
 */
export function isLegacyIcon(icon) {
  return typeof icon === 'string' && /^[a-z]+(?:-[a-z]+)*$/.test(icon);
}
