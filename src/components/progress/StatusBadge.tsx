import { type JobState } from "~/hooks/useJobProgress"; 

interface StatusBadgeProps {
  status: JobState['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${getStatusStyles(status)}`}
        >
          {status}
        </span>
      </div>

      {status === 'processing' && (
        <p className="text-sm text-gray-600 mt-2">
          Processing articles. This may take a few minutes depending on the size of your site. Please don't create new posts while this task is in progress.
        </p>
      )}
    </div>
  );
}