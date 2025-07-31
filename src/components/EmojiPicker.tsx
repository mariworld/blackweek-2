import React from 'react';

interface EmojiPickerProps {
  selectedEmojis: string[];
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_OPTIONS = [
  // Money emojis
  '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '💲', '🤑',
  '🏦', '🏧', '💹', '📊', '📈', '📉', '💱', '💯', 
  // Hand gestures with skin tones
  '👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿',
  '👏', '👏🏻', '👏🏼', '👏🏽', '👏🏾', '👏🏿',
  '🙌', '🙌🏻', '🙌🏼', '🙌🏽', '🙌🏾', '🙌🏿',
  '💪', '💪🏻', '💪🏼', '💪🏽', '💪🏾', '💪🏿',
  '✊', '✊🏻', '✊🏼', '✊🏽', '✊🏾', '✊🏿',
  '🤝', '🤝🏻', '🤝🏼', '🤝🏽', '🤝🏾', '🤝🏿',
  '🙏', '🙏🏻', '🙏🏼', '🙏🏽', '🙏🏾', '🙏🏿',
  // Happy/Smiley emojis
  '😊', '😄', '😃', '😁', '🥳', '😎', '🤩', '😍', '🥰', '😇',
  '🙂', '😌', '😋', '🤗', '🤔', '😏', '🥹', '☺️', '😆', '😂',
  // Celebration & Achievement emojis
  '🎯', '💡', '🚀', '🌟', '⭐', '🎊', '🎉', '🔥',
  '🏆', '👑', '💎', '⚡', '🎭', '🎨', '🎪', '🎵', '✨', '🌈',
  // Sports emojis
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎳',
  '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳',
  '⛸️', '🎣', '🤿', '🎿', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️',
  '🏊', '🏊‍♂️', '🏊‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵',
  '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🎱', '🏹',
  // Cars & vehicles emojis
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
  '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🚁', '✈️',
  '🚀', '🛸', '🚤', '⛵', '🚢', '🚂', '🚆', '🚇', '🚊', '🚝'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmojis: _selectedEmojis, onEmojiSelect }) => {
  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg transition-all hover:bg-gray-800 bg-black/50 border border-gray-700 hover:border-gray-500 cursor-pointer hover:scale-110"
            aria-label={`Select ${emoji} emoji`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};