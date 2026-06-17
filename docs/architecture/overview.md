# Architecture Overview

CornerOps AI is the operating brain for CornerMex. It owns business logic,
workers, repositories, memory, policies and operator workflows.

OpenClaw is integrated only as:

- self-hosted multichannel gateway
- controlled execution layer
- optional OpenAI-compatible model/tool gateway

It is not the source of truth for orders, leads, products, customers, memory or
permissions.

## Current Runtime

- Express backend serves API and built Command Center.
- React/Vite frontend provides operator dashboard.
- Repositories use Supabase when configured and local mocks/memory otherwise.
- OpenAI and OpenClaw are optional.

## Integration Boundary

All OpenClaw traffic enters through `src/integrations/openclaw`. Business
workers remain under `src/services/workers`, and data truth remains under
`src/data/repositories`.
