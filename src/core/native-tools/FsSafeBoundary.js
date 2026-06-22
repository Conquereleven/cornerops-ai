const path = require('path');

class FsSafeBoundary {
  constructor({ allowOutsideRoot = false, enabled = true, root = './.cornerops' } = {}) {
    this.allowOutsideRoot = allowOutsideRoot;
    this.enabled = enabled;
    this.root = path.resolve(process.cwd(), root);
  }

  resolve(candidate = '.') {
    const resolved = path.resolve(this.root, candidate);
    if (!this.enabled) return resolved;
    if (!this.allowOutsideRoot && !resolved.startsWith(`${this.root}${path.sep}`) && resolved !== this.root) {
      const error = new Error('Path traversal blocked by FsSafeBoundary.');
      error.code = 'FSSAFE_PATH_TRAVERSAL';
      throw error;
    }
    return resolved;
  }

  check(candidate = '.') {
    return {
      ok: true,
      root: this.root,
      resolvedPath: this.resolve(candidate),
    };
  }
}

module.exports = {
  FsSafeBoundary,
};
