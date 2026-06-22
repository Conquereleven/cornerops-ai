const { ask } = require('./ask');

const approvals = (action, id, options) => {
  if (action === 'approve' && id) return ask(`Approve approval ${id}`, options);
  if (action === 'reject' && id) return ask(`Reject approval ${id}`, options);
  return ask('Show pending approvals', options);
};

module.exports = { approvals };
