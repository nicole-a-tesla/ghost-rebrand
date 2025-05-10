import RebrandForm from "~/components/RebrandForm";
import ProgressBar from "~/components/ProgressBar";
import { useState } from 'react';

export default function Home() {
  const [rebrandRequested, setRebrandRequested] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md">
        { !rebrandRequested && <RebrandForm setRebrandRequested={setRebrandRequested}/> }
        { rebrandRequested && <ProgressBar /> }
      </div>
  </main>
  );
}
