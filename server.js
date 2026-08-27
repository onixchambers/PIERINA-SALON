const http = require('http');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) {
      console.error('Server listen error:', err);
      process.exit(1);
    }
    console.log(`> Aplicacion lista en http://localhost:${port}`);
  });

  // Mantener el event loop activo
  setInterval(() => {}, 60000);
}).catch((err) => {
  console.error('Error starting app:', err);
});
