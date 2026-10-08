import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// The first render of the full app in a test file is slow on a cold or busy
// runner. Async queries get more patience; what they assert is unchanged.
configure({ asyncUtilTimeout: 5000 });
