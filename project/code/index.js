import express from "express";
import os from "os";
import morgan from "morgan";
// Metrics and Log Collection
import promClient from "prom-client";
import responseTime from "response-time";
import pino from "pino";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("etag");

// Metrics and Log Collection
const logger = pino();
const logging = () => {
  logger.info("Testing: Logs");
};

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

// Custom Metrics
const httpReqCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const requestDurationHistogram = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "path", "status_code"],
  buckets: [0.1, 0.5, 1, 5, 10], // Buckets for the histogram in seconds
});

const requestDurationSummary = new promClient.Summary({
  name: "http_request_duration_summary_seconds",
  help: "Summary of the duration of HTTP requests in seconds",
  labelNames: ["method", "path", "status_code"],
  percentiles: [0.5, 0.9, 0.99], // Define your percentiles here
});

const gauge = new promClient.Gauge({
  name: "node_gauge_example",
  help: "Example of a gauge tracking async task duration",
  labelNames: ["method", "status"],
});

// app.use(
//   responseTime((req, res, time) => {
//     reqResDuration.labels(req.method, req.url, res.statusCode).observe(time);
//   })
// );

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // Duration in seconds
    httpReqCounter.labels(req.method, req.url, res.statusCode).inc();
    requestDurationHistogram
      .labels(req.method, req.url, res.statusCode)
      .observe(duration);
    requestDurationSummary
      .labels(req.method, req.url, res.statusCode)
      .observe(duration);
  });
  next();
});

// Routes
app.get("/", (req, res) => {
  try {
    res.send(`<h1>Hello World from ${os.hostname()}</h1>`);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong");
  }
});

app.get("/healthy", (req, res) => {
  res.status(200).json({
    name: "👀 - Obserability 🔥- Abhishek Veeramalla",
    status: "healthy",
  });
});

app.get("/serverError", (req, res) => {
  res.status(500).json({
    error: " Internal server error",
    statusCode: 500,
  });
});

app.get("/notFound", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    statusCode: "404",
  });
});

app.get("/logs", (req, res) => {
  logging();
  res.status(200).json({
    objective: "To generate logs",
  });
});

app.get("/crash", (req, res) => {
  process.exit(1);
});

const simulateAsyncTask = async () => {
  const randomTime = Math.random() * 5; // Random time between 0 and 5 seconds
  return new Promise((resolve) => setTimeout(resolve, randomTime * 1000));
};

app.get("/slow", async (req, res) => {
  const endGauge = gauge.startTimer({
    method: req.method,
    status: res.statusCode,
  });
  await simulateAsyncTask();
  endGauge();
  res.send("Async task completed");
});

const port = 8000;

app.listen(port, () => {
  console.log(`Server is running live on port: ${port}`);
});
