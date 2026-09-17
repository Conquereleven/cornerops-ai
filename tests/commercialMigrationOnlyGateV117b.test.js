const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(
  __dirname,
  '../supabase/migrations/20260722010000_cornerops_commercial_operations_v117a.sql',
);
const runbookPath = path.join(
  __dirname,
  '../docs/runbooks/commercial-operations-migration-v1.17a.md',
);
const migration = fs.readFileSync(migrationPath, 'utf8').toLowerCase();
const runbook = fs.readFileSync(runbookPath, 'utf8').toLowerCase();

describe('CO-1.17B migration-only static technical gate', () => {
  test('pins the exact reviewed migration hash', () => {
    expect(crypto.createHash('sha256').update(fs.readFileSync(migrationPath)).digest('hex'))
      .toBe('44cee38fe62e540b7bb12fea27ece4e424e448678ce47c497c268faeacd36705');
  });

  test('keeps runtime access least-privileged and external roles revoked', () => {
    expect(migration).toContain(
      'grant select, insert, update on cornerops_internal.commercial_entities to cornerops_internal_runtime',
    );
    expect(migration).toContain(
      'grant select, insert on cornerops_internal.commercial_transition_events to cornerops_internal_runtime',
    );
    expect(migration).toContain(
      'grant select, insert on cornerops_internal.commercial_evidence_registry to cornerops_internal_runtime',
    );
    expect(migration).toContain(
      'revoke update, delete, truncate on cornerops_internal.commercial_transition_events, cornerops_internal.commercial_evidence_registry from cornerops_internal_runtime',
    );
    expect(migration).toContain(
      'revoke all on all tables in schema cornerops_internal from public, anon, authenticated, service_role',
    );
  });

  test.each([
    'commercial_transition_events_append_only',
    'commercial_transition_events_reject_truncate',
    'commercial_evidence_registry_append_only',
    'commercial_evidence_registry_reject_truncate',
  ])('preserves owner-level immutable trigger %s', (trigger) => {
    expect(migration).toContain(`create trigger ${trigger}`);
  });

  test('documents every commercial object in dependency-safe rollback order', () => {
    const markers = [
      'drop `commercial_transition_events_append_only`',
      'drop `commercial_evidence_registry_append_only`',
      'drop `commercial_evidence_registry`.',
      'drop `commercial_transition_events`.',
      'drop `commercial_entities`.',
      'drop `reject_commercial_transition_mutation()`',
    ];
    const positions = markers.map((marker) => runbook.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(runbook).toContain('all three commercial tables, all four triggers');
    expect(runbook).toContain('never drop the shared schema/runtime role');
  });
});
