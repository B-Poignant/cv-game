import server from "./app.config";

const PORT = Number(process.env.PORT ?? 2567);

server.listen(PORT).catch((error: unknown) => {
  console.error(`Server failed to listen on port ${PORT}`, error);
  process.exit(1);
});
