import express from "express";
import os from "os";
import morgan from "morgan";
import promClient from "prom-client";
import responseTime from "response-time";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const register = new promClient.Registry();
register.setDefaultLabels({
  app: "example-nodejs-app",
});

const collectDefaultMetrics = promClient.collectDefaultMetrics;

collectDefaultMetrics({ register });

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
});

const reqResDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 1.5, 2],
  registers: [register],
});

app.use(
  responseTime((req, res, time) => {
    reqResDuration.labels(req.method, req.url, res.statusCode).observe(time);
  })
);

// Routes
app.get("/", (req, res) => {
  try {
    res.send(`<h1>Hello World from ${os.hostname()}</h1>`);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong");
  }
});

app.get("/crash", (req, res) => {
  process.exit(1);
});

app.get("/slow", (req, res) => {
  try {
    setTimeout(() => {
      res.send("Slow response");
    }, 3000);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong");
  }
});

const port = 8000;

app.listen(port, () => {
  console.log(`Server is running live on port: ${port}`);
});
