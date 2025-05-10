import { getQueue } from '../lib/queue';
import '../lib/jobProcessor';

console.log('Worker started');
console.log('Waiting for jobs...');

process.on('SIGINT', async () => {
  console.log('Worker shutting down...');

  const queue = getQueue();
  await queue.close();
  process.exit(0);
})