import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve } from 'node:path';

const [rootDirectoryArgument, portArgument] = process.argv.slice(2);

if (!rootDirectoryArgument || !portArgument) {
  throw new Error('Usage: node scripts/serve-spa.mjs <root-directory> <port>');
}

const rootDirectory = resolve(rootDirectoryArgument);
const port = Number.parseInt(portArgument, 10);

if (!Number.isInteger(port)) {
  throw new Error('Port must be an integer');
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.ttf', 'font/ttf']
]);

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function isInsideRoot(filePath) {
  const relativePath = relative(rootDirectory, filePath);

  return (
    relativePath.length === 0 ||
    (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  );
}

async function resolveFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const requestedPath = resolve(rootDirectory, pathname.slice(1));

  if (isInsideRoot(requestedPath) && await isFile(requestedPath)) {
    return requestedPath;
  }

  return resolve(rootDirectory, 'index.html');
}

const server = createServer((request, response) => {
  void resolveFilePath(request.url ?? '/')
    .then((filePath) => {
      response.statusCode = 200;
      response.setHeader(
        'Content-Type',
        contentTypes.get(extname(filePath)) ?? 'application/octet-stream'
      );
      createReadStream(filePath).pipe(response);
    })
    .catch(() => {
      response.statusCode = 500;
      response.end();
    });
});

server.listen(port, '127.0.0.1');
