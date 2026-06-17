# Agents

CornerOps workers are domain agents:

- `supportWorker`
- `salesWorker`
- `ordersWorker`
- `b2bWorker`
- `humanHandoffWorker`

OpenClaw may route channel messages toward these workers, but it does not
replace their business rules. Future specialized agents should be registered in
CornerOps first, then exposed through OpenClaw as routing targets.
