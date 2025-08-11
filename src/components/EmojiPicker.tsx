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
  '⛸️', '🎣', '🤿', '🎿', '🎱', '🏹',
  // Golfing with skin tones
  '🏌️', '🏌🏻', '🏌🏼', '🏌🏽', '🏌🏾', '🏌🏿',
  '🏌️‍♂️', '🏌🏻‍♂️', '🏌🏼‍♂️', '🏌🏽‍♂️', '🏌🏾‍♂️', '🏌🏿‍♂️',
  '🏌️‍♀️', '🏌🏻‍♀️', '🏌🏼‍♀️', '🏌🏽‍♀️', '🏌🏾‍♀️', '🏌🏿‍♀️',
  // Surfing with skin tones
  '🏄', '🏄🏻', '🏄🏼', '🏄🏽', '🏄🏾', '🏄🏿',
  '🏄‍♂️', '🏄🏻‍♂️', '🏄🏼‍♂️', '🏄🏽‍♂️', '🏄🏾‍♂️', '🏄🏿‍♂️',
  '🏄‍♀️', '🏄🏻‍♀️', '🏄🏼‍♀️', '🏄🏽‍♀️', '🏄🏾‍♀️', '🏄🏿‍♀️',
  // Swimming with skin tones
  '🏊', '🏊🏻', '🏊🏼', '🏊🏽', '🏊🏾', '🏊🏿',
  '🏊‍♂️', '🏊🏻‍♂️', '🏊🏼‍♂️', '🏊🏽‍♂️', '🏊🏾‍♂️', '🏊🏿‍♂️',
  '🏊‍♀️', '🏊🏻‍♀️', '🏊🏼‍♀️', '🏊🏽‍♀️', '🏊🏾‍♀️', '🏊🏿‍♀️',
  // Water polo with skin tones
  '🤽', '🤽🏻', '🤽🏼', '🤽🏽', '🤽🏾', '🤽🏿',
  '🤽‍♂️', '🤽🏻‍♂️', '🤽🏼‍♂️', '🤽🏽‍♂️', '🤽🏾‍♂️', '🤽🏿‍♂️',
  '🤽‍♀️', '🤽🏻‍♀️', '🤽🏼‍♀️', '🤽🏽‍♀️', '🤽🏾‍♀️', '🤽🏿‍♀️',
  // Biking with skin tones
  '🚴', '🚴🏻', '🚴🏼', '🚴🏽', '🚴🏾', '🚴🏿',
  '🚴‍♂️', '🚴🏻‍♂️', '🚴🏼‍♂️', '🚴🏽‍♂️', '🚴🏾‍♂️', '🚴🏿‍♂️',
  '🚴‍♀️', '🚴🏻‍♀️', '🚴🏼‍♀️', '🚴🏽‍♀️', '🚴🏾‍♀️', '🚴🏿‍♀️',
  // Mountain biking with skin tones
  '🚵', '🚵🏻', '🚵🏼', '🚵🏽', '🚵🏾', '🚵🏿',
  '🚵‍♂️', '🚵🏻‍♂️', '🚵🏼‍♂️', '🚵🏽‍♂️', '🚵🏾‍♂️', '🚵🏿‍♂️',
  '🚵‍♀️', '🚵🏻‍♀️', '🚵🏼‍♀️', '🚵🏽‍♀️', '🚵🏾‍♀️', '🚵🏿‍♀️',
  // Cartwheeling with skin tones
  '🤸', '🤸🏻', '🤸🏼', '🤸🏽', '🤸🏾', '🤸🏿',
  '🤸‍♂️', '🤸🏻‍♂️', '🤸🏼‍♂️', '🤸🏽‍♂️', '🤸🏾‍♂️', '🤸🏿‍♂️',
  '🤸‍♀️', '🤸🏻‍♀️', '🤸🏼‍♀️', '🤸🏽‍♀️', '🤸🏾‍♀️', '🤸🏿‍♀️',
  // Juggling with skin tones
  '🤹', '🤹🏻', '🤹🏼', '🤹🏽', '🤹🏾', '🤹🏿',
  '🤹‍♂️', '🤹🏻‍♂️', '🤹🏼‍♂️', '🤹🏽‍♂️', '🤹🏾‍♂️', '🤹🏿‍♂️',
  '🤹‍♀️', '🤹🏻‍♀️', '🤹🏼‍♀️', '🤹🏽‍♀️', '🤹🏾‍♀️', '🤹🏿‍♀️',
  // Cars & vehicles emojis
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
  '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🚁', '✈️',
  '🛸', '🚤', '⛵', '🚢', '🚂', '🚆', '🚇', '🚊', '🚝', '🛶'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmojis, onEmojiSelect }) => {
  const isMaxReached = selectedEmojis.length >= 5;

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg transition-all bg-black/50 border ${isMaxReached ? 'border-gray-800 opacity-50 cursor-not-allowed' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800 cursor-pointer hover:scale-110'}`}
            aria-label={`Select ${emoji} emoji`}
            disabled={isMaxReached}
          >
            {emoji}
          </button>
        ))}
      </div>
      {isMaxReached && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-sm text-yellow-200 text-center">
            Maximum of 5 emojis reached. Remove an emoji to add more.
          </p>
        </div>
      )}
    </div>
  );
};