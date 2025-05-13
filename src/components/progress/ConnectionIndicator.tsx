interface ConnectionIndicatorProps {
  connected: boolean;
}

export function ConnectionIndicator({ connected }: ConnectionIndicatorProps) {
  return (
    <div className="mb-4 flex items-center">
      <div
        className={`w-3 h-3 rounded-full mr-2 animate-pulse ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`}
        aria-hidden="true"
      />
      <span className="text-sm text-gray-600">
        {connected ? 'Connected' : 'Connecting...'}
      </span>
    </div>
  );
}
