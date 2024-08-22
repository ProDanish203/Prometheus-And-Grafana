# Monitoring And Logging

Monitoring and logging in Kubernetes are essential practices for observing, tracking, and analyzing the performance, health, and behavior of both the Kubernetes cluster and the applications running on it.

Key Components:

1. Monitoring: Collects and analyzes metrics from cluster components and applications.
2. Logging: Captures and stores event data and messages from various sources within the cluster.

Primary Functions:

- Ensure cluster and application health
- Facilitate troubleshooting and debugging
- Enable performance optimization
- Support capacity planning and scaling decisions
- Enhance security and compliance efforts

Tools:

- Monitoring: Prometheus, Grafana
- Logging: Loki, Elasticsearch

## Prometheus

- Prometheus is used for monitoring and gaining metrics.
- It is generally better to install the Prometheus instance on the Kubernetes cluster itself.
    - Deploy Prometheus as close to the targets as possible.
    - Make use of the pre-existing Kubernetes infrastructure.
- Prometheus can monitor applications running on the Kubernetes infrastructure.
- Prometheus can monitor the Kubernetes cluster, including:
    - Control-Plane Components (api-server, kube-scheduler)
    - Kubelet - Exposing container metrics
    - kube-state-metrics - Cluster-level metrics (deployments, pod metrics)
    - Node-exporter - Run on all nodes for host-related metrics (CPU, memory, network)
- Every host should run a node_exporter to expose CPU, memory, and network stats. A better option is to use a Kubernetes DaemonSet, which is a pod that runs on every node in the cluster.
- A Helm chart is a collection of template and YAML files that are converted into Kubernetes manifest files.

### Prometheus Operator:

- The Kube-Prometheus-stack chart makes use of the Prometheus Operator.
- The Prometheus Operator is a Kubernetes Operator, which is an application-specific controller that extends the Kubernetes API to create, configure, and manage instances of complex applications, such as Prometheus.
- The Prometheus Operator has several custom resources to aid the deployment and management of a Prometheus instance, such as AlertManager, PrometheusRule, ServiceMonitor, and PodMonitor.
- The Prometheus Operator chart can be found at: `https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack`

### Installation:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack

# Open dashboard through port-forwarding
kubectl port-forward prometheus-prometheus-kube-prometheus-prometheus-0 9090
```

### Service Monitors

- Service Monitors define a set of targets for Prometheus to monitor and scrape.
- They allow you to avoid directly modifying Prometheus configurations and provide a declarative Kubernetes syntax to define targets.

## Grafana

- Grafana is an open-source platform for monitoring and observability.
- It allows you to query, visualize, alert on, and understand your metrics no matter where they are stored.
- Key features include:
    1. Data source support: Grafana can connect to various data sources like Prometheus, Elasticsearch, InfluxDB, and many others.
    2. Customizable dashboards: Create and share dynamic dashboards with a multitude of visualization options.
    3. Alerting: Set up alert rules for your most important metrics and get notified via various channels (email, Slack, PagerDuty, etc.).
    4. Annotations: Add context to your graphs with rich events.
    5. Plugin ecosystem: Extend Grafana's functionality with a wide range of plugins.
- Grafana is often used in conjunction with Prometheus for visualizing metrics.

## Grafana Loki

- Loki is a horizontally-scalable, highly-available, multi-tenant log aggregation system inspired by Prometheus.
- Key features of Loki include:
    1. Efficient storage: Loki uses object storage for storing compressed, unindexed log content, making it cost-effective for storing large volumes of logs.
    2. Label-based indexing: Similar to Prometheus, Loki indexes and groups log streams using labels, allowing for efficient querying and storage.
    3. LogQL: Loki uses LogQL, a query language inspired by PromQL, allowing for powerful log querying capabilities.
    4. Multi-tenancy: Loki supports multi-tenancy out of the box, making it suitable for use by multiple teams or in service provider scenarios.
    5. Integration with Grafana: Loki integrates seamlessly with Grafana for log visualization and exploration.

## Getting Started: Express Server

- Install Prometheus Client: `npm i prom-client@11.5.3`
- Configure Prometheus client and create route for metrics

```
const collectDefaultMetrics = promClient.collectDefaultMetrics;

collectDefaultMetrics({ register: promClient.register });

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", promClient.register.contentType);
  const metrics = await promClient.register.metrics();
  res.end(metrics);
});
```

- Create a `prometheus-config.yaml` file and apply the following:

```yaml
global:
  scrape_interval: 4s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["YOUR_IP_ADDRESS:PORT"]

```

- Create a `docker-compose.yaml file` and apply the following

```yaml
version: "3"

services:
  prom-server:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus-config.yaml:/etc/prometheus/prometheus.yml

```

- Setup Grafana, pull the image and run on port:3000

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
```

- Open Grafana Dashboard on `http://localhost:3000`

```
Username: admin #default
Password: admin #default
```

- Install Grafana Loki

```
docker run -d --name=loki -p 3100:3100 grafana/loki

# access logs
http://localhost:3100/metrics
```

## Important Resources

- https://gist.github.com/piyushgarg-dev/7c4016b12301552b628bbac21a11e6ab