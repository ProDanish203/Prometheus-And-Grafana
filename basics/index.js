import express from "express";
import os from "os";
import morgan from "morgan";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`<h1>Hello World from ${os.hostname()}</h1>`);
});

// Create a route that crashes the server
app.get("/crash", (req, res) => {
  process.exit(1);
});

app.get("/slow", (req, res) => {
  setTimeout(() => {
    res.send("Slow response");
  }, 5000);
});

const port = 8000;

app.listen(port, () => {
  console.log(`Server is running live on port: ${port}`);
});
