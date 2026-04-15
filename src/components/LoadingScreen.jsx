export default function LoadingScreen({ message }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        {/* Animated logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-terra-300 to-terra-400 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        </div>

        {/* Message */}
        <p className="font-display text-2xl text-gray-900 mb-4">{message}</p>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-terra-300 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-terra-300 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-terra-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
