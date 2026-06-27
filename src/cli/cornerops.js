#!/usr/bin/env node
process.env.CORNEROPS_CLI_MODE = 'true';

const readline = require('readline');
const env = require('../config/env');
const { approvals } = require('./commands/approvals');
const { actions } = require('./commands/actions');
const { ask } = require('./commands/ask');
const { audit } = require('./commands/audit');
const { briefing } = require('./commands/briefing');
const { controlTower } = require('./commands/controlTower');
const { health } = require('./commands/health');
const { help } = require('./commands/help');

const execute = async (args, options = {}) => {
  const [command = 'help', ...rest] = args;
  switch (command) {
    case 'ask':
      return ask(rest.join(' '), options);
    case 'briefing':
      return briefing(options);
    case 'control':
      return controlTower(options);
    case 'health':
      return health(options);
    case 'approvals':
      return approvals(rest[0], rest[1], options);
    case 'actions':
      return actions(options);
    case 'audit':
      return audit(rest[0], options);
    case 'help':
    case '--help':
    case '-h':
      return help(options);
    default:
      return ask([command, ...rest].join(' '), options);
  }
};

const print = (output) => {
  process.stdout.write(`${output.responseText}\n`);
  if (output.status === 'error') process.exitCode = 1;
};

const interactive = async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let sessionId;
  process.stdout.write('CornerOps Interactive Operator Beta v0.5\nType help for commands; type exit to stop.\n\n');
  const prompt = () => rl.question('cornerops> ', async (line) => {
    const text = line.trim();
    if (['exit', 'quit'].includes(text.toLowerCase())) return rl.close();
    if (!text) return prompt();
    const output = await execute(['ask', text], { sessionId });
    sessionId = output.sessionId;
    print(output);
    process.stdout.write('\n');
    return prompt();
  });
  prompt();
};

const main = async () => {
  if (!env.corneropsCliEnabled) {
    process.stderr.write('CornerOps CLI is disabled by CORNEROPS_CLI_ENABLED.\n');
    process.exitCode = 1;
    return;
  }
  const args = process.argv.slice(2);
  if (!args.length) return interactive();
  print(await execute(args));
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerOps CLI failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { execute, main, print };
