import { createServer, IncomingMessage, ServerResponse } from "node:http";
import app from "./app";

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (req, res) => {
  const host = req.headers.host ?? `localhost:${port}`;
  const url = new URL(req.url ?? "/", `http://${host}`);
  const body = await readBody(req);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
  });
  const response = await app.fetch(request);

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

  if (response.body) {
    const reader = response.body.getReader();
    await pump(reader, res);
  } else {
    res.end();
  }
});

server.listen(port, () => {
  console.log(`hono-docs site running at http://localhost:${port}`);
});

function readBody(req: IncomingMessage): Promise<ArrayBuffer> | undefined {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("error", reject);
    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    });
  });
}

async function pump(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  res: ServerResponse<IncomingMessage>
) {
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      res.end();
      return;
    }

    res.write(value);
  }
}
