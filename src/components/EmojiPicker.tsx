import React from 'react';

interface EmojiPickerProps {
  selectedEmojis: string[];
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_OPTIONS = [
  // Money emojis
  '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '💲', '🤑',
  '🏦', '🏧', '💹', '📊', '📈', '📉', '💱', '💯', 
  // Original emojis
  '🎯', '💡', '🚀', '🌟', '⭐', '🎊', '🎉', '🔥', '💪',
  '🏆', '👑', '💎', '⚡', '🎭', '🎨', '🎪', '🎵', '📱', '💻'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmojis, onEmojiSelect }) => {
  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg transition-all ${
              selectedEmojis.length >= 4
                ? 'opacity-50 cursor-not-allowed bg-gray-800'
                : 'hover:bg-gray-800 bg-black/50 border border-gray-700 hover:border-gray-500 cursor-pointer hover:scale-110'
            }`}
            disabled={selectedEmojis.length >= 4}
            aria-label={`Select ${emoji} emoji`}
          >
            {emoji}
          </button>
        ))}
      </div>
      {selectedEmojis.length >= 4 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Maximum of 4 emojis reached
        </p>
      )}
    </div>
  );
};