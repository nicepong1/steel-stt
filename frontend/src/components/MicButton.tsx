"use client";

interface MicButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ isRecording, onClick, disabled }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-200 cursor-pointer
        ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
            : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* 녹음 중 펄스 애니메이션 */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
      )}

      {/* 마이크 아이콘 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-8 h-8 relative z-10"
      >
        {isRecording ? (
          /* 정지 아이콘 */
          <rect x="6" y="6" width="12" height="12" rx="2" />
        ) : (
          /* 마이크 아이콘 */
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        )}
      </svg>
    </button>
  );
}
