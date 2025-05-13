import { useRouter } from 'next/router';
import { ProgressBar } from '~/components/progress/ProgressBar';
import { useJobProgress } from "~/hooks/useJobProgress";
import { StatusBadge } from '~/components/progress/StatusBadge';
import { CompletionMessage } from '~/components/progress/CompletionMessage';
import { ErrorMessage } from '~/components/progress/ErrorMessage';
import { ConnectionIndicator } from '~/components/progress/ConnectionIndicator';

export default function ProgressPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const { jobState, connected, error } = useJobProgress(jobId, router.isReady);

  if (!router.isReady || !jobId) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  let percentDone = 0;
  if (jobState.totalPostCount && jobState.totalPostCount > 0) {
    percentDone = Math.floor((jobState.completedIdCount / jobState.totalPostCount) * 100);
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 my-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Rebranding Progress
      </h1>

      <ConnectionIndicator connected={connected} />
      <ProgressBar completedCount={jobState.completedIdCount} totalCount={jobState.totalPostCount} />
      <StatusBadge status={jobState.status} />

      {error && (
        <ErrorMessage error={error} />
      )}

      {jobState.status === 'completed' && (
        <CompletionMessage completedCount={jobState.completedIdCount} failedIds={jobState.failedIds} />
      )}
    </div>
  );
}