interface ProgressBarProps {
  completedCount: number;
  totalCount: number | null;
}

export function ProgressBar({ completedCount, totalCount }: ProgressBarProps) {
  let percentDone = 0;
  if (totalCount && totalCount > 0) {
    percentDone = Math.floor((completedCount / totalCount) * 100);
  }

  return (
    <div className="mb-6">
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${percentDone}%` }}
          role="progressbar"
          aria-valuenow={percentDone}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress Bar"
        />
      </div>

      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>{percentDone}% complete</span>
        {totalCount && (
          <span>
            {completedCount} of {totalCount} posts processed
          </span>
        )}
      </div>
    </div>
  );
}