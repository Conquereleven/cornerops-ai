# OpenClaw Ecosystem Capability Matrix v0.2

This matrix is based on the provided CornerOps planning scope. Items are treated as capabilities to evaluate through CornerOps policy before any real execution.

| Project | Category | Usefulness | Priority | Decision | Risk | Data Touched | Permissions | PII | Approval | Read-only | Dry-run | Sandbox | Adapter | Agent | Flag | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gitcrawl | crawler | GitHub issue/PR context | p0 | integrate_now | medium | repo metadata | GitHub read | medium | sync/write | yes | yes | no | GitcrawlAdapter | dev/security | GITCRAWL_ENABLED | Keep mock until token read-only |
| slacrawl | crawler | Slack ops/sales history | p0 | integrate_now | high | messages | Slack read | yes | sync | yes | yes | no | SlacrawlAdapter | sales/security | SLACRAWL_ENABLED | Add channel allowlist |
| wacrawl | crawler | WhatsApp archive search | p0 | integrate_now | critical | messages | local archive read | yes | sync | yes | yes | yes | WacrawlAdapter | sales/orders | WACRAWL_ENABLED | Never send messages |
| notcrawl | crawler | Notion supplier notes | p0 | integrate_now | high | docs/notes | Notion read | yes | sync | yes | yes | no | NotcrawlAdapter | briefing/sales | NOTCRAWL_ENABLED | Add database allowlist |
| telecrawl | crawler | Telegram history | p1 | integrate_now | critical | messages | Telegram read | yes | sync | yes | yes | yes | TelecrawlAdapter | sales/orders | TELECRAWL_ENABLED | Keep mock |
| crawlkit | crawler | Shared crawler interface | p0 | integrate_now | low | normalized records | local only | no | no | yes | yes | no | CrawlkitAdapter | all | CRAWLERS_ENABLED | Extend adapters |
| fs-safe | library | Filesystem boundary | p0 | integrate_now | low | local paths | local fs | possible | writes | yes | yes | yes | FsSafeBoundary | security | FS_SAFE_ENABLED | Keep root-bound |
| clawpdf | library | PDF catalog context | p1 | stub_now | medium | PDFs | local file read | possible | real parse | yes | yes | no | ClawPdfAdapter | sales/security | CLAWPDF_ENABLED | Add parser later |
| plugin-inspector | sdk | Plugin risk reports | p0 | integrate_now | high | plugin manifests | local read | no | risky plugin enable | yes | yes | no | PluginInspectorService | dev/security | PLUGIN_INSPECTOR_ENABLED | Add manifest parser |
| clawbench | sdk | Agent/context evals | p1 | integrate_now | low | eval outputs | local only | no | real suites | yes | yes | no | ClawbenchBenchmarkService | dev/security | CLAWBENCH_ENABLED | Add benchmark fixtures |
| agent-skills | sdk | Approved skill catalog | p0 | integrate_now | medium | skill metadata | local/ClawHub read | no | enable skill | yes | yes | no | AgentSkillsCatalog | all | CLAWHUB_ENABLED | Enforce allowlist |
| mcporter | sdk | MCP bridge | p1 | stub_now | high | tool calls | MCP access | possible | real call | yes | yes | yes | McporterMcpAdapter | dev/security | MCPORTER_ENABLED | Route through policy |
| acpx | sdk | Agent session bridge | p1 | stub_now | medium | sessions | local/session | possible | real session | yes | yes | no | AcpxSessionAdapter | dev | ACP_ENABLED | Keep stateless dry-run |
| gogcli | native | Google Workspace context | p1 | stub_now | high | docs/email/files | Google read | high | enable/sync | yes | yes | yes | GogcliWorkspaceAdapter | briefing/security | GOGCLI_ENABLED | Add allowlist |
| goplaces | native | Public lead discovery | p1 | stub_now | medium | public places | network read | low | real network | yes | yes | no | GoPlacesLeadDiscoveryAdapter | sales | GOPLACES_ENABLED | Keep public-only |
| wacli | native | WhatsApp archive/search | p0 | stub_now | critical | messages | local/app data | high | enable/sync | yes | yes | yes | WacliArchiveAdapter | sales/orders | WACLI_ENABLED | No send actions |
| discrawl | crawler | Discord archive | later | document_only | medium | messages | Discord read | yes | yes | yes | yes | yes | DiscrawlAdapter | security | DISCRAWL_ENABLED | Revisit later |
| imsgcrawl | crawler | iMessage archive | later | document_only | critical | personal messages | host data | high | yes | maybe | yes | yes | none | security | IMSGCRAWL_ENABLED | Reject until explicit consent |
| photoscrawl | crawler | Photos archive | later | document_only | critical | photos/media | host data | high | yes | maybe | yes | yes | none | security | PHOTOSCRAWL_ENABLED | Revisit after privacy design |
| graincrawl | crawler | Granola notes | later | document_only | medium | meeting notes | local read | yes | sync | yes | yes | no | GraincrawlAdapter | briefing | GRAINCrawl_ENABLED | Stub only |
| crawlbar | crawler | UI crawler | later | document_only | high | browser/UI | host UI | possible | yes | no | yes | yes | none | security | none | Reject until sandbox |
| Tachikoma | sdk | agent framework | later | document_only | medium | sessions/tools | local/tooling | possible | yes | yes | yes | no | none | dev | none | Evaluate later |
| clawpatch | sdk | patch/PR landing | later | document_only | critical | code/repo | git writes | no | yes | no | yes | yes | ClawpatchAdapter | dev | CLAWPATCH_ENABLED | No PR landing |
| rastermill | library | image processing | later | document_only | medium | images | local file read | possible | real parse | yes | yes | no | RastermillImageAdapter | sales | RASTERMILL_ENABLED | Stub |
| ffmpeg-wasm | library | audio preprocessing | later | document_only | medium | media | local file read | high | real parse | yes | yes | no | FfmpegWasmMediaAdapter | support | FFMPEG_WASM_ENABLED | Stub |
| libopus-wasm | library | voice codec | later | document_only | medium | audio | local file read | high | real parse | yes | yes | no | none | support | none | Document only |
| libterminal | library | terminal primitives | later | document_only | critical | terminal streams | command exec | possible | yes | no | yes | yes | LibterminalAdapter | dev | none | Block by default |
| proxyline | library | proxy routing | later | document_only | high | network routes | network | possible | yes | no | yes | yes | ProxylineAdapter | security | none | Document only |
| Peekaboo | native | screen capture/UI | later | document_only | critical | screen | host UI | high | yes | no | yes | yes | none | security | none | Reject by default |
| AXorcist | native | accessibility automation | later | document_only | critical | UI | host UI | high | yes | no | yes | yes | none | security | none | Reject by default |
| imsg | native | iMessage tooling | later | document_only | critical | messages | host account | high | yes | maybe | yes | yes | none | security | none | Explicit consent only |
| remindctl | native | reminders | later | document_only | high | personal tasks | host account | high | yes | no | yes | yes | none | briefing | none | Later |
| spogo | native | music/media context | later | document_only | medium | media account | account read | medium | yes | yes | yes | no | none | none | none | Not relevant now |
| songsee | native | music context | later | document_only | medium | media account | account read | medium | yes | yes | yes | no | none | none | none | Not relevant now |
| openclaw-ansible | other | deployment automation | later | document_only | critical | infra | host/cloud | possible | yes | no | yes | yes | none | dev/security | none | Defer |
| crabline | other | CLI workflow | later | document_only | high | commands | terminal | possible | yes | no | yes | yes | none | dev | none | Defer |
| Kova | other | unknown/eval | later | document_only | medium | unknown | unknown | possible | yes | unknown | yes | yes | none | dev | none | Research later |
| openclaw-rtt | other | realtime transport | later | document_only | high | realtime data | network | possible | yes | yes | yes | yes | none | all | none | Defer |
| openclaw-windows-node | other | Windows node | later | document_only | high | host node | host | possible | yes | no | yes | yes | none | dev | none | Defer |
| clawdex | other | indexing/search | later | document_only | medium | docs | local read | possible | yes | yes | yes | no | none | all | none | Evaluate after archive |
| crabpot | other | sandbox/pot | later | document_only | high | execution | host | possible | yes | no | yes | yes | none | security | none | Defer |
| kitchen-sink | other | examples | later | document_only | medium | examples | local read | no | no | yes | yes | no | none | dev | none | Reference only |
| ask-molty | other | Q&A | later | document_only | medium | unknown | unknown | possible | yes | yes | yes | no | none | all | none | Defer |
| docs/community/rfcs/releases/homebrew-tap | other | project info/distribution | later | document_only | low | public metadata | network read | no | no | yes | yes | no | none | dev | none | Review manually |

Rejected for now: any tool requiring personal credentials, host UI automation, cookie-based access, external sends, destructive writes, or production credentials without explicit approval and sandboxing.
