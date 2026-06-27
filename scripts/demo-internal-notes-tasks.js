const { CONTROLLED_ACTION_IDS, context, createDemoHarness } = require('./controlled-actions-demo-harness');

const run = async () => {
  const harness = createDemoHarness({
    corneropsControlledActionsDryRun: false,
    corneropsActionInternalNoteCreateDryRun: false,
    corneropsActionInternalTaskCreateDryRun: false,
    corneropsAllowLocalInternalWrites: true,
  });
  const note = await harness.executor.requestApproval(CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE, {
    title: 'Quote follow-up', body: 'Review the quote locally.', relatedEntityType: 'quote',
  }, { ...context('b2b-sales-agent', 'demo-note-1'), requestedDryRun: false });
  await harness.approvalService.approveApproval(note.approvalId, 'founder-demo');
  const noteResult = await harness.executor.executeApproval(note.approvalId, { dryRun: false, operatorId: 'founder-demo' });
  const task = await harness.executor.requestApproval(CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE, {
    title: 'Review stale B2B leads', description: 'Read-only follow-up review.', priority: 'high',
  }, { ...context('daily-briefing-agent', 'demo-task-1'), requestedDryRun: false });
  await harness.approvalService.approveApproval(task.approvalId, 'founder-demo');
  const taskResult = await harness.executor.executeApproval(task.approvalId, { dryRun: false, operatorId: 'founder-demo' });
  const result = {
    note: { id: noteResult.resource.id, sourceMode: noteResult.resource.sourceMode },
    task: { id: taskResult.resource.id, sourceMode: taskResult.resource.sourceMode },
    localNotes: harness.noteRepository.list().length,
    localTasks: harness.taskRepository.list().length,
    businessDatabaseWrites: 0,
    externalSideEffects: 0,
    auditEvents: harness.auditLogService.list().length,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
};

if (require.main === module) run().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
module.exports = { run };
