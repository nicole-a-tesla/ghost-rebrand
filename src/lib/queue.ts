import Queue from 'bull';
import Bull from 'bull';
import 'dotenv/config'

const redisOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
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

    rebrandQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed with error: ${err}`);
    });

  }
  return rebrandQueue;
}

export default getQueue;