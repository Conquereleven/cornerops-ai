# Memory

CornerOps owns conversation memory, summaries and entity extraction.

OpenClaw sessions may carry transient channel context, request IDs and metadata,
but long-lived business memory must remain in CornerOps repositories.

The `MemoryBridge` maps CornerOps conversation context into OpenClaw session
metadata without duplicating source-of-truth memory.
