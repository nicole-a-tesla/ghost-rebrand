import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/router';
import util from "util";

export default function ProgressPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [jobState, setJobState] = useState({
    status: "pending",
    totalPostCount: null,
    completedIdCount: 0,
    failedIds: []
  })
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!router.isReady || !jobId) return;

    // close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    // create new connection
    const eventSource = new EventSource(`/api/progress/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    }

    eventSource.onmessage = (event) => {

      try {
        const data = JSON.parse(event.data);

        // todo delete?
        if (data.error) {
          setError(data.error);
          return;
        }

        setJobState(data)

        if (data.status === "completed") {
          eventSource.close();
          setConnected(false);
        }

      } catch (error) { 
        setError(`Error parsing event data: ${error}`);
      }
    };

    eventSource.onerror = (error) => {
      setConnected(false);
      setError(`Error connecting to server`);
    };

    // clean up
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    }
  }, [router.isReady, jobId]);

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

      <div className="mb-4 flex items-center">
        <div
          className={`w-3 h-3 rounded-full mr-2 animate-pulse ${connected ? "bg-green-500" : "bg-red-500"}`}
          aria-hidden="true"
        ></div>
        <span className="text-sm text-gray-600">
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>

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
          ></div>
        </div>

        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{percentDone}% complete</span>
          { jobState.totalPostCount && (
            <span>
              {jobState.completedIdCount} of {jobState.totalPostCount || "?"} posts processed
            </span>
          )}
        </div>
      </div>

      {
        <div className="mb-4">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              jobState.status === 'completed' ? 'bg-green-100 text-green-800' :
              jobState.status === 'failed' ? 'bg-red-100 text-red-800' :
              jobState.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              { jobState.status }
            </span>
          </div>
          
          { jobState.status === 'processing' && (
            <p className="text-sm text-gray-600 mt-2">
              Processing articles. This may take a few minutes depending on the size of your site.
            </p>
          )}
        </div>
      }

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4" aria-live="assertive">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {jobState.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4" aria-live="polite">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Rebranding Complete!</h3>
              <p className="text-sm text-green-700 mt-1">
                Successfully processed {jobState.completedIdCount} articles.
              </p>
              {jobState.failedIds.length !== 0 && (
                <div className="text-sm text-green-700 mt-1">
                  <p className="font-bold">However, {jobState.failedIds.length} posts could not be updated via the api. Please check the following posts and update manually if necessary:</p>
                  <ul>
                    { jobState.failedIds.map((id) => <li key={id}>{id}</li>) }
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}