import cluster from 'node:cluster';
import os from 'node:os';
import process from 'node:process';
import http from 'node:http';
import next from 'next';

const numCPUs = os.cpus().length;
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

if (cluster.isPrimary) {
  console.log(`=======================================================`);
  console.log(`🚀 PMCS High-Performance Cluster Manager`);
  console.log(`Primary Master Process PID: ${process.pid}`);
  console.log(`Detected CPU Cores: ${numCPUs}`);
  console.log(`Spawning ${numCPUs} load-balanced worker processes...`);
  console.log(`=======================================================`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({ CLUSTER_WORKER_ID: `${i + 1}` });
  }

  cluster.on('online', (worker) => {
    console.log(`✓ Worker ${worker.process.pid} (ID: ${worker.id}) is online and ready for traffic.`);
  });

  // Auto-healing: If a worker dies, immediately replace it
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠ Worker ${worker.process.pid} died (${signal || code}). Spawning replacement worker...`);
    cluster.fork();
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nGracefully shutting down cluster workers...');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  // Worker process runs Next.js server
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    const server = http.createServer((req, res) => {
      // Add worker metadata header for load balancing verification
      res.setHeader('X-Cluster-Worker-Id', `${process.pid}`);
      handle(req, res);
    });

    server.listen(port, hostname, () => {
      console.log(`> Worker ${process.pid} listening on http://${hostname}:${port}`);
    });

    process.on('SIGTERM', () => {
      server.close(() => {
        process.exit(0);
      });
    });
  }).catch((err) => {
    console.error(`Error starting Next.js worker ${process.pid}:`, err);
    process.exit(1);
  });
}
