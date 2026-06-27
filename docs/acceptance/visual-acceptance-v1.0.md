# Visual / Local Acceptance v1.0

The embedded browser plugin is not a release gate for v1.0 because it fails before connecting in this environment with a missing sandbox metadata field.

v1.0 uses deterministic local acceptance instead:

1. Frontend TypeScript and Vitest.
2. Vite production build.
3. HTTP smoke against local server on `127.0.0.1`.
4. Auth checks for protected Control Tower APIs.
5. Static built bundle scan for expected dashboard labels and absence of raw secrets.

Required visible/dashboard sections:

- Founder Beta Readiness
- Control Tower
- Approval Center
- Audit Viewer
- Security Dashboard
- Operator Ask
- Controlled Actions

Expected API checks:

- `/api/health` returns 200.
- `/api/control-tower/v1.0/status` rejects missing auth when console auth is enabled.
- `/api/control-tower/v1.0/status` accepts valid local auth.
- `/api/actions` accepts valid local auth.

This method verifies the same founder-facing surfaces without relying on the broken embedded browser runtime.
