import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/router';
import util from "util";

export default function ProgressPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [progressData, setProgressData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const log = (...args: any[]) => {
    console.log(
      util.inspect(args)
    )
  }
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
      console.log("Connection opened");
      setConnected(true);
      setError(null);
    }

    eventSource.onmessage = (event) => {

      try {
        const data = JSON.parse(event.data);
        console.log("Message received:");
        log({ data });
        if (data.connected) {
          setConnected(true);
          return
        }

        if (data.error) {
          setError(data.error);
          return;
        }

        setProgressData(data);

        if (data.status === "complete") {
          eventSource.close();
          setConnected(false);
        }

      } catch (error) { 
        console.log({error})
        setError(`Error parsing event data: ${error}`);
      }
    };

    eventSource.onerror = (error) => {
      console.log("Error occurred:");
      setConnected(false);
      setError(`Error connecting to server: ${error}`);
    };

    // clean up
    return () => {
      console.log("Cleaning up event source");
      eventSource.close();
      eventSourceRef.current = null;
    }
  }, [router.isReady, jobId]);

  if (!router.isReady || !jobId) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  let percentDone = 0;
  if (progressData && progressData.totalCount) {
    percentDone = progressData.processedCount / progressData.totalCount * 100;
  }


  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 my-8">

     <div>
       <h3>Data:</h3>
       <p>connected: {connected}</p>
       <p>error: {error}</p>
       <p>progressData:</p>
       { progressData && progressData.totalCount && Object.entries(progressData).map(([key, value]) => (
         <p key={key}>{key}: {value}</p>
       )) }
       <p>percentDone: {percentDone}</p>
     </div>

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Rebranding Progress
      </h1>

      <div className="mb-4 flex items-center">
        <div
          className={`w-3 h-3 rounded-full mr-2 ${connected ? "bg-green-500" : "bg-red-500 animate-pulse"}`}
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
          { progressData && (
            <span>
              {progressData.processedCount} of {progressData.totalCount || "?"} posts processed
            </span>
          )}
        </div>
      </div>

      {progressData && (
        <div className="mb-4">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              progressData.status === 'completed' ? 'bg-green-100 text-green-800' :
              progressData.status === 'failed' ? 'bg-red-100 text-red-800' :
              progressData.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              { progressData.status }
            </span>
          </div>
          
          { progressData.status === 'processing' && (
            <p className="text-sm text-gray-600 mt-2">
              Processing articles. This may take a few minutes depending on the size of your site.
            </p>
          )}
        </div>
      )}

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

      {progressData && progressData.status === 'completed' && (
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
                Successfully updated {progressData.processedCount} articles.
              </p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}