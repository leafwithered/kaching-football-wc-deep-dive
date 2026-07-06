import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = normalize(join(import.meta.dirname, ".."));
const outFile = join(root, "KACHING_SHORT_VIDEO.webm");
const port = 8032;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webm": "video/webm"
};

function safePath(urlPath) {
  const requested = normalize(join(root, decodeURIComponent(urlPath.split("?")[0])));
  if (!requested.startsWith(root)) return null;
  return requested;
}

createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/save-video") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      await writeFile(outFile, body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, bytes: body.length }));
      return;
    }

    const pathname = req.url === "/" ? "/tools/kaching_video_generator.html" : req.url;
    const filePath = safePath(pathname);
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch (error) {
    res.writeHead(404);
    res.end(String(error?.message || error));
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Video server running at http://127.0.0.1:${port}/`);
});
