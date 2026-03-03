const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MOVIES_DIR = path.join(__dirname, 'move');
const PORT = 8080;

const MIME_TYPES = {
  '.mp4': 'video/mp4', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime', '.wmv': 'video/x-ms-wmv', '.webm': 'video/webm',
  '.m4v': 'video/mp4', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
};

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function getMovies() {
  if (!fs.existsSync(MOVIES_DIR)) { fs.mkdirSync(MOVIES_DIR, { recursive: true }); return []; }
  const files = fs.readdirSync(MOVIES_DIR);
  const movies = [];
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (VIDEO_EXTS.includes(ext)) {
      const nameWithoutExt = path.basename(file, ext);
      let thumbnail = null;
      for (const imgExt of IMAGE_EXTS) {
        const imgPath = path.join(MOVIES_DIR, nameWithoutExt + imgExt);
        if (fs.existsSync(imgPath)) { thumbnail = nameWithoutExt + imgExt; break; }
      }
      const stats = fs.statSync(path.join(MOVIES_DIR, file));
      movies.push({
        name: nameWithoutExt, file: file, thumbnail: thumbnail,
        size: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
        modified: stats.mtime.toISOString()
      });
    }
  });
  return movies.sort((a, b) => new Date(b.modified) - new Date(a.modified));
}

function serveFile(res, filePath, isVideo, req) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const stat = fs.statSync(filePath);
  if (isVideo && req.headers.range) {
    const parts = req.headers.range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1,
      'Content-Type': contentType, 'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(isVideo ? 200 : 200, {
      'Content-Length': stat.size, 'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*', 'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (pathname === '/api/movies') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getMovies())); return;
  }
  if (pathname.startsWith('/thumbnail/')) {
    serveFile(res, path.join(MOVIES_DIR, pathname.replace('/thumbnail/', '')), false, req); return;
  }
  if (pathname.startsWith('/video/')) {
    serveFile(res, path.join(MOVIES_DIR, pathname.replace('/video/', '')), true, req); return;
  }
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, path.join(__dirname, 'index.html'), false, req); return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎬 CineVault Running!`);
  console.log(`📺 PC:  http://localhost:${PORT}`);
  console.log(`📺 TV:  http://<YOUR_PC_IP>:${PORT}`);
  console.log(`💡 Windows IP: run 'ipconfig' | Mac/Linux: 'ifconfig'\n`);
});
