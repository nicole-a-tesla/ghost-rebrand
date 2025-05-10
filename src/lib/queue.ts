import Queue from 'bull';
import Bull from 'bull';

// todo check these settings
const redisOptions = {
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    enableOffLineQueue: true,
  },
  limiter: {
    max: 100,
    duration: 10000,
  },
};

let rebrandQueue: Bull.Queue | null = null;

export const getQueue = (): Bull.Queue => {
  if (!rebrandQueue) {
    rebrandQueue = new Queue('renaming-queue', redisOptions);

    rebrandQueue.on('global:completed', (job, result) => {
      console.log({job, result})
      console.log(`Job ${job.id} completed with result: ${result}`);
    });
    rebrandQueue.on('failed', (job, err) => {
      console.log({job, err})
      console.error(`Job ${job.id} failed with error: ${err}`);
    });

  }
  return rebrandQueue;
}

export default getQueue;