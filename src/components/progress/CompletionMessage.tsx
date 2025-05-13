interface CompletionMessageProps {
  completedCount: number;
  failedIds: string[];
}

export function CompletionMessage({ completedCount, failedIds }: CompletionMessageProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4" aria-live="polite">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">Rebranding Complete!</h3>
          <p className="text-sm text-green-700 mt-1">
            Successfully processed {completedCount} articles.
          </p>
          {failedIds.length > 0 && (
            <div className="text-sm text-green-700 mt-1">
              <p className="font-bold">
                However, we were unable to update {failedIds.length} posts via the API. 
                Please check the following post ids and update manually if necessary:
              </p>
              <ul className="mt-2 list-disc list-inside">
                {failedIds.map((id) => (
                  <li key={id} className="text-xs">
                    {id}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}