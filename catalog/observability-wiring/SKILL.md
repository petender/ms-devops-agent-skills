---
name: observability-wiring
description: "Use this skill when the user asks to add observability (traces, metrics, structured logs) to an application."
---

# App Observability Wiring

## When to invoke

The user wants their app to emit traces + metrics + structured logs, typically to Azure Monitor / Application Insights, or to an OpenTelemetry Collector.

## Guardrails

- Use the OpenTelemetry SDK for the app's language; use the vendor-neutral OTLP exporter.
- Prefer **auto-instrumentation** where available (Node, Python, .NET, Java).
- Emit **W3C traceparent** headers so services correlate.
- Logs are **structured JSON**, and every log line includes the current trace/span id.
- Sampling: head-based, parent-based, default 10% for prod; 100% for dev.
- Never log secrets, tokens, or PII.

## Node.js snippet

```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

## For Azure

Two paths:
1. **Native**: use the `@azure/monitor-opentelemetry` distro. One line: `useAzureMonitor()`.
2. **OTLP → Collector → Azure**: run OpenTelemetry Collector with `azuremonitor` exporter.

## Process

1. Identify language + framework.
2. Pick auto-instrumentation.
3. Wire the exporter with env vars, never hard-coded endpoints.
4. Add `resource` attributes: `service.name`, `service.version`, `deployment.environment`.
5. Verify: hit the app, then `az monitor app-insights query` or the portal Live Metrics.

