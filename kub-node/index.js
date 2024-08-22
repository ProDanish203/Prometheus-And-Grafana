import express from "express";
import os from "os";
import morgan from "morgan";
import swStats from "swagger-stats";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// /swagger-stats/metrics
app.use(
  swStats.getMiddleware({
    name: "My API",
    version: "1.0.0",
    hostname: os.hostname(),
    ip: "",
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
