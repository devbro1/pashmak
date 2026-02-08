# @devbro/neko-queue

A robust, scalable job queue and background task processing library for Node.js and TypeScript. Process tasks asynchronously with support for multiple queue providers, retries, priorities, and delayed jobs.

## Installation

```bash
npm install @devbro/neko-queue
```

## Features

- 🚀 **Multiple Providers** - Redis, Memory, and custom provider support
- 🔄 **Retry Mechanism** - Automatic retry with exponential backoff
- ⚡ **Priority Queues** - Process high-priority jobs first
- ⏰ **Delayed Jobs** - Schedule jobs to run at a specific time
- 🎯 **Job Events** - Listen to job lifecycle events
- 📊 **Progress Tracking** - Track job progress and status
- 🔒 **Concurrency Control** - Limit parallel job processing
- 🛡️ **Type-Safe** - Full TypeScript support
- 📈 **Scalable** - Horizontal scaling with Redis
- 🔍 **Monitoring** - Built-in job status and metrics

## Quick Start

```ts
import { Queue, MemoryProvider } from '@devbro/neko-queue';

// Create a queue
const queue = new Queue({
  name: 'email-queue',
  provider: new MemoryProvider(),
});

// Define a job processor
queue.process(async (job) => {
  const { email, subject, body } = job.data;
  await sendEmail(email, subject, body);
  console.log(`Email sent to ${email}`);
});

// Add jobs to the queue
await queue.add({
  email: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
});

// Start processing
await queue.start();
```

## Core Concepts

### Creating a Queue

```ts
import { Queue, MemoryProvider } from '@devbro/neko-queue';

const queue = new Queue({
  name: 'my-queue',
  provider: new MemoryProvider(),
  concurrency: 5, // Process 5 jobs concurrently
});
```

### Adding Jobs

```ts
// Simple job
await queue.add({
  task: 'send-notification',
  userId: 123,
});

// Job with options
await queue.add(
  { task: 'generate-report', reportId: 456 },
  {
    priority: 10, // Higher priority
    attempts: 3, // Retry up to 3 times
    delay: 5000, // Delay 5 seconds before processing
    timeout: 30000, // Timeout after 30 seconds
  }
);

// Bulk add jobs
const jobs = [
  { type: 'email', to: 'user1@example.com' },
  { type: 'email', to: 'user2@example.com' },
  { type: 'email', to: 'user3@example.com' },
];

await queue.addBulk(jobs);
```

### Processing Jobs

```ts
// Basic processor
queue.process(async (job) => {
  console.log('Processing job:', job.id);
  console.log('Job data:', job.data);

  // Your business logic here
  await performTask(job.data);

  return { success: true };
});

// Processor with progress tracking
queue.process(async (job) => {
  await job.progress(0);

  // Step 1
  await doFirstStep(job.data);
  await job.progress(33);

  // Step 2
  await doSecondStep(job.data);
  await job.progress(66);

  // Step 3
  await doThirdStep(job.data);
  await job.progress(100);

  return { completed: true };
});

// Named processor (for multiple job types)
queue.process('send-email', async (job) => {
  await sendEmail(job.data);
});

queue.process('generate-report', async (job) => {
  await generateReport(job.data);
});
```

### Job Lifecycle Events

```ts
// Job completed
queue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

// Job failed
queue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

// Job progress
queue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Job started
queue.on('active', (job) => {
  console.log(`Job ${job.id} started`);
});

// Job delayed
queue.on('delayed', (job, delay) => {
  console.log(`Job ${job.id} delayed by ${delay}ms`);
});

// Job waiting
queue.on('waiting', (job) => {
  console.log(`Job ${job.id} is waiting`);
});

// Error events
queue.on('error', (error) => {
  console.error('Queue error:', error);
});
```

## Queue Providers

### Memory Provider (Development)

In-memory queue for development and testing:

```ts
import { Queue, MemoryProvider } from '@devbro/neko-queue';

const queue = new Queue({
  name: 'dev-queue',
  provider: new MemoryProvider(),
});
```

**Pros:**

- No external dependencies
- Fast and simple
- Good for testing

**Cons:**

- Jobs lost on restart
- No persistence
- Cannot scale across processes

### Redis Provider (Production)

Persistent, scalable queue backed by Redis:

```ts
import { Queue, RedisProvider } from '@devbro/neko-queue';

const queue = new Queue({
  name: 'prod-queue',
  provider: new RedisProvider({
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
  }),
});
```

**Pros:**

- Persistent storage
- Horizontal scaling
- Distributed processing
- High performance

**Cons:**

- Requires Redis server

**Advanced Redis Configuration:**

```ts
const queue = new Queue({
  name: 'advanced-queue',
  provider: new RedisProvider({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    // Connection pool
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // TLS for secure connections
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  }),
  concurrency: 10,
});
```

## Advanced Features

### Priority Queues

Process high-priority jobs first:

```ts
// Add jobs with different priorities
await queue.add({ task: 'low-priority' }, { priority: 1 });
await queue.add({ task: 'normal' }, { priority: 5 });
await queue.add({ task: 'high-priority' }, { priority: 10 });
await queue.add({ task: 'critical' }, { priority: 100 });

// Jobs are processed in priority order: critical > high > normal > low
```

### Delayed Jobs

Schedule jobs to run in the future:

```ts
// Run after 1 hour
await queue.add({ task: 'send-reminder' }, { delay: 60 * 60 * 1000 });

// Run at specific time
const runAt = new Date('2026-02-01T00:00:00Z');
const delay = runAt.getTime() - Date.now();

await queue.add({ task: 'monthly-report' }, { delay });
```

### Job Retry with Backoff

Automatically retry failed jobs:

```ts
await queue.add(
  { task: 'api-call', url: 'https://api.example.com' },
  {
    attempts: 5, // Retry up to 5 times
    backoff: {
      type: 'exponential', // exponential or fixed
      delay: 1000, // Initial delay 1s
    },
  }
);

// Retry delays: 1s, 2s, 4s, 8s, 16s
```

### Job Timeout

Set maximum execution time:

```ts
await queue.add(
  { task: 'long-running' },
  {
    timeout: 30000, // Timeout after 30 seconds
  }
);

queue.process(async (job) => {
  // If this takes longer than 30s, job will fail
  await longRunningOperation();
});
```

### Concurrency Control

Limit parallel job processing:

```ts
const queue = new Queue({
  name: 'cpu-intensive',
  provider: new RedisProvider(redisConfig),
  concurrency: 2, // Process only 2 jobs at a time
});
```

### Job Removal

```ts
// Remove a specific job
await queue.remove(jobId);

// Remove all waiting jobs
await queue.clean('waiting');

// Remove all completed jobs
await queue.clean('completed');

// Remove all failed jobs
await queue.clean('failed');

// Remove jobs older than 24 hours
await queue.clean('completed', 24 * 60 * 60 * 1000);
```

### Pause and Resume

```ts
// Pause queue
await queue.pause();
console.log('Queue paused');

// Resume queue
await queue.resume();
console.log('Queue resumed');

// Check if paused
const isPaused = await queue.isPaused();
```

## Real-World Examples

### Email Queue

```ts
import { Queue, RedisProvider } from '@devbro/neko-queue';
import nodemailer from 'nodemailer';

const emailQueue = new Queue({
  name: 'email-queue',
  provider: new RedisProvider({
    host: process.env.REDIS_HOST,
    port: 6379,
  }),
  concurrency: 5,
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;

  await job.progress(10);

  await transporter.sendMail({
    from: 'noreply@example.com',
    to,
    subject,
    html,
  });

  await job.progress(100);

  return { sent: true, to };
});

// Handle events
emailQueue.on('completed', (job, result) => {
  console.log(`Email sent to ${result.to}`);
});

emailQueue.on('failed', (job, error) => {
  console.error(`Failed to send email to ${job.data.to}:`, error);
});

// Add email jobs
export async function sendWelcomeEmail(email: string, name: string) {
  await emailQueue.add(
    {
      to: email,
      subject: 'Welcome!',
      html: `<h1>Hello ${name}!</h1><p>Welcome to our service.</p>`,
    },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );
}

await emailQueue.start();
```

### Image Processing Queue

```ts
import { Queue, RedisProvider } from '@devbro/neko-queue';
import sharp from 'sharp';

const imageQueue = new Queue({
  name: 'image-processing',
  provider: new RedisProvider(redisConfig),
  concurrency: 3,
});

imageQueue.process(async (job) => {
  const { inputPath, outputPath, width, height } = job.data;

  await job.progress(0);

  // Resize image
  await sharp(inputPath).resize(width, height).toFile(outputPath);

  await job.progress(50);

  // Generate thumbnail
  await sharp(inputPath).resize(200, 200).toFile(outputPath.replace('.jpg', '_thumb.jpg'));

  await job.progress(100);

  return { processed: true, outputPath };
});

// Add image processing job
export async function processUploadedImage(imagePath: string) {
  await imageQueue.add(
    {
      inputPath: imagePath,
      outputPath: imagePath.replace('uploads', 'processed'),
      width: 1200,
      height: 800,
    },
    {
      priority: 5,
      timeout: 60000, // 1 minute timeout
    }
  );
}

await imageQueue.start();
```

### Report Generation

```ts
import { Queue, RedisProvider } from '@devbro/neko-queue';

const reportQueue = new Queue({
  name: 'report-generation',
  provider: new RedisProvider(redisConfig),
  concurrency: 2,
});

reportQueue.process(async (job) => {
  const { reportType, userId, dateRange } = job.data;

  await job.progress(10);

  // Fetch data
  const data = await fetchReportData(reportType, dateRange);
  await job.progress(40);

  // Generate report
  const report = await generatePDF(data);
  await job.progress(70);

  // Upload to S3
  const url = await uploadToS3(report, `reports/${userId}/${reportType}.pdf`);
  await job.progress(90);

  // Notify user
  await notifyUser(userId, url);
  await job.progress(100);

  return { url, reportType };
});

// Schedule daily reports
export async function scheduleDailyReport(userId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const delay = tomorrow.getTime() - Date.now();

  await reportQueue.add(
    {
      reportType: 'daily-summary',
      userId,
      dateRange: { start: new Date(), end: tomorrow },
    },
    {
      delay,
      priority: 8,
    }
  );
}

await reportQueue.start();
```

### Data Import Queue

```ts
import { Queue, RedisProvider } from '@devbro/neko-queue';

const importQueue = new Queue({
  name: 'data-import',
  provider: new RedisProvider(redisConfig),
  concurrency: 1, // Process one at a time to avoid conflicts
});

importQueue.process(async (job) => {
  const { fileUrl, importType } = job.data;

  await job.progress(5);

  // Download file
  const file = await downloadFile(fileUrl);
  await job.progress(20);

  // Parse CSV/JSON
  const records = await parseFile(file, importType);
  await job.progress(40);

  // Process in batches
  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await database.insertBatch(batch);

    const progress = 40 + ((i + batchSize) / records.length) * 60;
    await job.progress(Math.min(progress, 100));
  }

  return { imported: records.length, type: importType };
});

// Monitor progress
importQueue.on('progress', (job, progress) => {
  console.log(`Import ${job.id}: ${progress}% complete`);
});

await importQueue.start();
```

## Monitoring and Metrics

### Get Queue Statistics

```ts
const stats = await queue.getStats();
console.log(stats);
/*
{
  waiting: 10,
  active: 2,
  completed: 150,
  failed: 5,
  delayed: 3,
  paused: false
}
*/
```

### Get Job Status

```ts
const job = await queue.getJob(jobId);
console.log(job.status); // 'waiting' | 'active' | 'completed' | 'failed'
console.log(job.progress); // 0-100
console.log(job.result); // Job result if completed
console.log(job.error); // Error if failed
```

### List Jobs

```ts
// Get waiting jobs
const waitingJobs = await queue.getJobs('waiting', 0, 10);

// Get completed jobs
const completedJobs = await queue.getJobs('completed', 0, 100);

// Get failed jobs
const failedJobs = await queue.getJobs('failed');
```

## Best Practices

1. **Use Redis in Production** - Memory provider is for development only
2. **Set Appropriate Concurrency** - Based on your workload and resources
3. **Implement Error Handling** - Always handle job failures gracefully
4. **Set Timeouts** - Prevent jobs from running indefinitely
5. **Use Priorities Wisely** - Don't abuse high priorities
6. **Clean Up Old Jobs** - Regularly remove completed/failed jobs
7. **Monitor Queue Health** - Track queue stats and failed jobs
8. **Graceful Shutdown** - Properly close queues on app shutdown
9. **Retry Strategy** - Use exponential backoff for transient failures
10. **Progress Tracking** - Report progress for long-running jobs

## Graceful Shutdown

```ts
const queue = new Queue({
  name: 'my-queue',
  provider: new RedisProvider(redisConfig),
});

// Start processing
await queue.start();

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');

  // Stop accepting new jobs
  await queue.pause();

  // Wait for active jobs to complete
  await queue.close();

  console.log('Shutdown complete');
  process.exit(0);
});
```

## TypeScript Support

Full TypeScript definitions included:

```ts
import { Queue, Job, JobOptions, QueueOptions } from '@devbro/neko-queue';

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

const emailQueue = new Queue<EmailJobData>({
  name: 'email-queue',
  provider: new RedisProvider(config),
});

emailQueue.process(async (job: Job<EmailJobData>) => {
  const { to, subject, body } = job.data; // Type-safe!
  await sendEmail(to, subject, body);
});

await emailQueue.add({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Test',
});
```

## API Reference

### `Queue`

#### Constructor Options

```ts
interface QueueOptions {
  name: string; // Queue name
  provider: QueueProvider; // Storage provider
  concurrency?: number; // Max concurrent jobs (default: 1)
  defaultJobOptions?: JobOptions; // Default options for all jobs
}
```

#### Methods

- `add(data, options?)` - Add a job to the queue
- `addBulk(jobs)` - Add multiple jobs at once
- `process(handler)` - Register job processor
- `start()` - Start processing jobs
- `pause()` - Pause job processing
- `resume()` - Resume job processing
- `close()` - Close queue and cleanup
- `getJob(jobId)` - Get job by ID
- `getJobs(status, start?, end?)` - List jobs by status
- `remove(jobId)` - Remove a job
- `clean(status, grace?)` - Remove jobs by status
- `getStats()` - Get queue statistics
- `isPaused()` - Check if queue is paused

#### Events

- `active` - Job started processing
- `completed` - Job completed successfully
- `failed` - Job failed
- `progress` - Job progress updated
- `waiting` - Job added to queue
- `delayed` - Job delayed
- `error` - Queue error

### `JobOptions`

```ts
interface JobOptions {
  priority?: number; // Job priority (higher = first)
  delay?: number; // Delay in milliseconds
  attempts?: number; // Max retry attempts
  timeout?: number; // Job timeout
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}
```

## Troubleshooting

### Jobs Not Processing

- Ensure `queue.start()` has been called
- Check if queue is paused with `queue.isPaused()`
- Verify provider connection (Redis)
- Check concurrency settings

### High Memory Usage

- Clean up old completed jobs regularly
- Reduce concurrency
- Process jobs in smaller batches

### Jobs Timing Out

- Increase timeout value
- Optimize job processing logic
- Split into smaller jobs

### Redis Connection Issues

- Verify Redis server is running
- Check connection credentials
- Enable connection retries
- Monitor Redis memory usage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Packages

- [@devbro/neko-scheduler](https://www.npmjs.com/package/@devbro/neko-scheduler) - Cron-based task scheduling
- [@devbro/neko-cache](https://www.npmjs.com/package/@devbro/neko-cache) - Caching solution
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
