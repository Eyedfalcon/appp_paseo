const { getDefaultConfig } = require("expo/metro-config");
const http = require("node:http");
const config = getDefaultConfig(__dirname);
const previous = config.server.enhanceMiddleware;
// Development web preview only. Android talks to EXPO_PUBLIC_API_URL directly.
config.server.enhanceMiddleware = (middleware, server) => {
  const next = previous ? previous(middleware, server) : middleware;
  return (req, res, nextHandler) => {
    if (!req.url.startsWith("/api/v1/")) return next(req, res, nextHandler);
    const headers = { ...req.headers, host: "localhost:8080" };
    delete headers.origin;
    const upstream = http.request(
      {
        hostname: "localhost",
        port: 8080,
        path: req.url,
        method: req.method,
        headers,
      },
      (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "El backend local no está disponible en el puerto 8080.",
        }),
      );
    });
    req.pipe(upstream);
  };
};
module.exports = config;
