const { randomUUID } = require('crypto');
const { sanitizePersistencePayload } = require('../security/SecuritySanitizer');
const {
  OPEN_WORK_ITEM_STATUSES,
  WORK_ITEM_PRIORITIES,
  createWorkQueueError,
} = require('./workQueueTypes');

const clone = (value) => (value === null || value === undefined
  ? value
  : JSON.parse(JSON.stringify(value)));
const now = () => new Date().toISOString();

class MemoryInternalOperationsStore {
  constructor({ state } = {}) {
    this.state = state || { workItems: [], approvals: [], auditEvents: [] };
  }

  async health() {
    return { healthy: true, provider: 'memory_test_only', durable: false };
  }

  appendAudit(event) {
    const record = {
      id: randomUUID(),
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId || null,
      actorType: event.actorType || 'system',
      actorId: event.actorId || null,
      correlationId: event.correlationId || null,
      metadata: sanitizePersistencePayload(event.metadata || {}),
      createdAt: now(),
    };
    this.state.auditEvents.push(record);
    return record;
  }

  async recordAuditEvent(event) { return clone(this.appendAudit(event)); }

  async syncRecommendations(recommendations, context = {}) {
    const result = {
      scannedRecommendations: recommendations.length,
      createdWorkItems: 0,
      reusedWorkItems: 0,
      reopenedWorkItems: 0,
      skippedRecommendations: 0,
      errors: [],
    };
    const items = [];
    const activeKeys = new Set(recommendations.map((item) => item.idempotencyKey).filter(Boolean));
    for (const existing of this.state.workItems) {
      if (existing.sourceType === 'action_engine'
        && !activeKeys.has(existing.idempotencyKey)
        && existing.evidence?.conditionActive !== false) {
        existing.evidence = { ...(existing.evidence || {}), conditionActive: false };
        existing.updatedAt = now();
        existing.version += 1;
        this.appendAudit({
          eventType: 'work_item_condition_cleared',
          entityType: 'work_item',
          entityId: existing.id,
          ...context,
        });
      }
    }
    for (const recommendation of recommendations) {
      if (!recommendation.idempotencyKey || !recommendation.title || !recommendation.actionType) {
        result.skippedRecommendations += 1;
        continue;
      }
      let item = this.state.workItems.find(
        (candidate) => candidate.idempotencyKey === recommendation.idempotencyKey,
      );
      if (item && OPEN_WORK_ITEM_STATUSES.includes(item.status)) {
        if (item.evidence?.conditionActive === false) {
          item.evidence = { ...(item.evidence || {}), conditionActive: true };
          item.updatedAt = now();
          item.version += 1;
          this.appendAudit({
            eventType: 'work_item_condition_returned',
            entityType: 'work_item',
            entityId: item.id,
            ...context,
          });
        }
        result.reusedWorkItems += 1;
        this.appendAudit({
          eventType: 'work_item_reused', entityType: 'work_item', entityId: item.id, ...context,
        });
      } else if (item) {
        if (item.evidence?.conditionActive !== false) {
          result.skippedRecommendations += 1;
          items.push(clone(item));
          continue;
        }
        item.status = recommendation.approvalRequired ? 'queued_for_approval' : 'recommended';
        item.approvalStatus = recommendation.approvalRequired ? 'pending' : null;
        item.completedAt = null;
        item.dismissedAt = null;
        item.updatedAt = now();
        item.evidence = { ...item.evidence, ...recommendation.evidence, conditionActive: true };
        item.version += 1;
        result.reopenedWorkItems += 1;
        this.appendAudit({
          eventType: 'work_item_reopened', entityType: 'work_item', entityId: item.id, ...context,
        });
      } else {
        item = this.createWorkItem(recommendation);
        this.state.workItems.push(item);
        result.createdWorkItems += 1;
        this.appendAudit({
          eventType: 'work_item_created',
          entityType: 'work_item',
          entityId: item.id,
          ...context,
          metadata: { idempotencyKey: item.idempotencyKey },
        });
        if (item.approvalRequired) this.createApprovalForWorkItem(item, context);
      }
      items.push(clone(item));
    }
    return { ...result, items };
  }

  createWorkItem(recommendation) {
    const timestamp = now();
    return {
      id: randomUUID(),
      idempotencyKey: recommendation.idempotencyKey,
      sourceType: recommendation.sourceType || 'action_engine',
      sourceId: recommendation.sourceId || null,
      sourceFlow: recommendation.sourceFlow || null,
      actionType: recommendation.actionType,
      title: recommendation.title,
      description: recommendation.description || null,
      priority: WORK_ITEM_PRIORITIES.includes(recommendation.priority)
        ? recommendation.priority : 'medium',
      status: recommendation.approvalRequired
        ? 'queued_for_approval' : (recommendation.status || 'recommended'),
      operatingStage: recommendation.operatingStage || null,
      ownerType: recommendation.ownerType || null,
      ownerId: recommendation.ownerId || null,
      approvalRequired: Boolean(recommendation.approvalRequired),
      approvalStatus: recommendation.approvalRequired ? 'pending' : null,
      evidence: sanitizePersistencePayload(recommendation.evidence || {}),
      safePayload: sanitizePersistencePayload(recommendation.safePayload || {}),
      dueAt: recommendation.dueAt || null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      dismissedAt: null,
      version: 1,
    };
  }

  createApprovalForWorkItem(item, context = {}) {
    const existing = this.state.approvals.find(
      (approval) => approval.workItemId === item.id && approval.status === 'pending',
    );
    if (existing) return existing;
    const timestamp = now();
    const approval = {
      id: randomUUID(),
      workItemId: item.id,
      approvalType: item.actionType,
      status: 'pending',
      requestedBy: context.actorId || 'system',
      requestedAt: timestamp,
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
      expiresAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.approvals.push(approval);
    this.appendAudit({
      eventType: 'approval_requested',
      entityType: 'approval_request',
      entityId: approval.id,
      ...context,
      metadata: { workItemId: item.id },
    });
    return approval;
  }

  async listWorkItems(filters = {}) {
    const limit = Math.max(1, Math.min(Number(filters.limit) || 100, 500));
    return clone(this.state.workItems.filter((item) => (
      (!filters.status || item.status === filters.status)
      && (!filters.priority || item.priority === filters.priority)
      && (!filters.sourceFlow || item.sourceFlow === filters.sourceFlow)
      && (!filters.actionType || item.actionType === filters.actionType)
      && (filters.approvalRequired === undefined
        || item.approvalRequired === filters.approvalRequired)
      && (!filters.operatingStage || item.operatingStage === filters.operatingStage)
      && (!filters.owner || item.ownerId === filters.owner)
    )).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit));
  }

  async getWorkItem(id) {
    return clone(this.state.workItems.find((item) => item.id === id) || null);
  }

  async updateWorkItem(id, command, context = {}) {
    const item = this.state.workItems.find((candidate) => candidate.id === id);
    if (!item) return null;
    if (Number(command.version) !== item.version) {
      throw createWorkQueueError('Work item version is stale.', 'WORK_ITEM_VERSION_CONFLICT', 409);
    }
    const event = command.command;
    if (event === 'set_priority') {
      if (!WORK_ITEM_PRIORITIES.includes(command.priority)) {
        throw createWorkQueueError('Priority is invalid.', 'WORK_ITEM_PRIORITY_INVALID');
      }
      item.priority = command.priority;
    } else if (event === 'assign_owner') {
      item.ownerType = command.ownerType || 'founder';
      item.ownerId = command.ownerId || 'founder';
    } else if (event === 'set_due_date') {
      item.dueAt = command.dueAt || null;
    } else if (event === 'set_status') {
      if (!['recommended', 'drafted', 'in_progress', 'expired'].includes(command.status)) {
        throw createWorkQueueError('Status is invalid.', 'WORK_ITEM_STATUS_INVALID');
      }
      item.status = command.status;
    } else if (event === 'mark_manually_completed') {
      if (!String(command.reason || '').trim()) {
        throw createWorkQueueError('Completion reason is required.', 'WORK_ITEM_REASON_REQUIRED');
      }
      item.status = 'manually_completed';
      item.completedAt = now();
    } else if (event === 'dismiss') {
      if (!String(command.reason || '').trim()) {
        throw createWorkQueueError('Dismissal reason is required.', 'WORK_ITEM_REASON_REQUIRED');
      }
      item.status = 'dismissed';
      item.dismissedAt = now();
    } else {
      throw createWorkQueueError(
        'Work item command is not allowed.', 'WORK_ITEM_COMMAND_DENIED', 403,
      );
    }
    item.updatedAt = now();
    item.version += 1;
    this.appendAudit({
      eventType: `work_item_${event}`,
      entityType: 'work_item',
      entityId: item.id,
      ...context,
      metadata: { reason: command.reason, version: item.version },
    });
    return clone(item);
  }

  async listApprovals(filters = {}) {
    const limit = Math.max(1, Math.min(Number(filters.limit) || 100, 500));
    return clone(this.state.approvals
      .filter((item) => !filters.status || item.status === filters.status)
      .slice(0, limit));
  }

  async getApproval(id) {
    return clone(this.state.approvals.find((item) => item.id === id) || null);
  }

  async decideApproval(id, decision, context = {}) {
    const approval = this.state.approvals.find((item) => item.id === id);
    if (!approval) return null;
    if (approval.status !== 'pending') {
      throw createWorkQueueError('Approval is already resolved.', 'APPROVAL_CONFLICT', 409);
    }
    if (!['approved', 'rejected', 'cancelled'].includes(decision)) {
      throw createWorkQueueError('Approval decision is invalid.', 'APPROVAL_DECISION_INVALID');
    }
    if (!String(context.reason || '').trim()) {
      throw createWorkQueueError('Decision reason is required.', 'APPROVAL_REASON_REQUIRED');
    }
    approval.status = decision;
    approval.decidedBy = context.actorId || 'founder';
    approval.decidedAt = now();
    approval.decisionReason = String(context.reason);
    approval.updatedAt = now();
    const item = this.state.workItems.find((candidate) => candidate.id === approval.workItemId);
    if (item) {
      item.status = decision === 'approved' ? 'approved' : 'rejected';
      item.approvalStatus = decision;
      item.updatedAt = now();
      item.version += 1;
    }
    this.appendAudit({
      eventType: `approval_${decision}`,
      entityType: 'approval_request',
      entityId: approval.id,
      ...context,
      metadata: { workItemId: approval.workItemId, executed: false },
    });
    return clone(approval);
  }

  async listAuditEvents(filters = {}) {
    const limit = Math.max(1, Math.min(Number(filters.limit) || 100, 500));
    return clone(this.state.auditEvents.slice().reverse()
      .filter((event) => !filters.eventType || event.eventType === filters.eventType)
      .slice(0, limit));
  }

  async metrics() {
    const open = this.state.workItems.filter((item) => OPEN_WORK_ITEM_STATUSES.includes(item.status));
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      openWorkItems: open.length,
      highPriorityWorkItems: open.filter((item) => ['critical', 'high'].includes(item.priority)).length,
      pendingApprovals: this.state.approvals.filter((item) => item.status === 'pending').length,
      draftsAwaitingReview: open.filter((item) => item.safePayload?.sendStatus === 'not_sent').length,
      completedThisWeek: this.state.workItems.filter(
        (item) => item.completedAt && Date.parse(item.completedAt) >= weekAgo,
      ).length,
      oldestUnresolvedAt: open.map((item) => item.createdAt).sort()[0] || null,
    };
  }
}

module.exports = { MemoryInternalOperationsStore };
