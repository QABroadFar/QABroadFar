import { useState, useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

import './IconPicker.css';

export function EmojiDisplay({ emoji, size = 20, style, className }) {
  // Handle both emoji characters and short names
  const displayEmoji = typeof emoji === 'string' ? emoji : '';

  return (
    <span
      className={['emoji-display', className].filter(Boolean).join(' ')}
      style={{
        fontSize: `${size}px`,
        lineHeight: `${size}px`,
        width: size,
        height: size,
        ...style,
      }}
      role="img"
      aria-label={displayEmoji}
    >
      {displayEmoji}
    </span>
  );
}

export default function IconPicker({ selectedEmoji, onSelect, color = '#3b82f6' }) {
  const [showPicker, setShowPicker] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showPicker]);

  const handleSelect = (e) => {
    // Use native emoji if available, otherwise use id
    const selected = e.native || e.id;
    onSelect(selected);
    setShowPicker(false);
  };

  return (
    <div className="icon-picker-container" ref={wrapperRef}>
      <button
        className="icon-picker-trigger"
        onClick={() => setShowPicker((s) => !s)}
        style={{ borderColor: color }}
        type="button"
        aria-label="Pilih emoji"
      >
        <EmojiDisplay emoji={selectedEmoji || '☰'} size={26} />
      </button>

      {showPicker && (
        <div className="emoji-picker-wrapper" data-is-mobile={window.innerWidth <= 480}>
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme="dark"
            previewPosition="none"
          />
        </div>
      )}
    </div>
  );
}
