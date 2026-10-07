// Jalankan `next dev` mulai dari port 3100 (atau env PORT). Jika port sudah dipakai
// (EADDRINUSE), coba port berikutnya (+1) sampai menemukan yang kosong.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import net from 'node:net';

const BASE_PORT = Number(process.env.PORT) || 3100;
const MAX_TRIES = 50;

const isPortFree = (port) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') resolve(false);
      else reject(err);
    });
    // Tanpa host → bind ke `::` (dual-stack), sama seperti `next dev`.
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port);
  });

let port = BASE_PORT;
while (!(await isPortFree(port))) {
  if (port - BASE_PORT >= MAX_TRIES) {
    console.error(`Tidak ada port kosong di rentang ${BASE_PORT}-${port}.`);
    process.exit(1);
  }
  console.warn(`Port ${port} sudah dipakai, mencoba ${port + 1}...`);
  port += 1;
}

const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next');
const child = spawn(
  process.execPath,
  [nextBin, 'dev', '--port', String(port), ...process.argv.slice(2)],
  {
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit',
  }
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
