const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const loadEnvWith = (values) => {
  jest.resetModules();
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const env = require('../src/config/env');
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return env;
};

describe('Railway hosted backend readiness v1.3.5', () => {
  test('package start command runs the backend server', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts.start).toBe('node src/server.js');
  });

  test('Procfile starts the web process with npm start', () => {
    expect(fs.readFileSync(path.join(root, 'Procfile'), 'utf8').trim()).toBe('web: npm start');
  });

  test('railway.json uses npm start and health check endpoint', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'railway.json'), 'utf8'));
    expect(config.build.builder).toBe('NIXPACKS');
    expect(config.build.buildCommand).toContain('Skipping frontend build');
    expect(config.deploy.startCommand).toBe('npm start');
    expect(config.deploy.healthcheckPath).toBe('/api/health');
  });

  test('production bind host defaults to 0.0.0.0 for hosted environments', () => {
    const env = loadEnvWith({
      NODE_ENV: 'production',
      CORNEROPS_BIND_HOST: '',
    });
    expect(env.bindHost).toBe('0.0.0.0');
  });

  test('development bind host remains loopback by default', () => {
    const env = loadEnvWith({
      NODE_ENV: 'development',
      CORNEROPS_BIND_HOST: '',
    });
    expect(env.bindHost).toBe('127.0.0.1');
  });
});
