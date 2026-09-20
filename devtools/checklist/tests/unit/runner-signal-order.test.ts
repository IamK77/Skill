import { beforeEach, expect, it, vi } from 'vitest';
const observation = vi.hoisted(() => ({ calls: [] as { int: number; term: number }[] }));
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: (...args: Parameters<typeof actual.spawn>) => {
    observation.calls.push({ int: process.listenerCount('SIGINT'), term: process.listenerCount('SIGTERM') });
    return actual.spawn(...args);
  } };
});
import { runCheck } from '../../src/runner.js';
beforeEach(() => { observation.calls.length = 0; });

it('arms interruption cleanup before a sensor can run', async () => {
  const before = { int: process.listenerCount('SIGINT'), term: process.listenerCount('SIGTERM') };
  const result = await runCheck({ id: 'sensor', description: 'sensor', verify: 'shell:printf ready' }, process.cwd(), process.cwd());
  expect(result.result?.status).toBe('pass');
  expect(observation.calls).toEqual([{ int: before.int + 1, term: before.term + 1 }]);
  expect(process.listenerCount('SIGINT')).toBe(before.int);
  expect(process.listenerCount('SIGTERM')).toBe(before.term);
});

it('removes armed interruption handlers if spawn throws synchronously', async () => {
  const before = { int: process.listenerCount('SIGINT'), term: process.listenerCount('SIGTERM') };
  // A NUL argument is rejected synchronously by Node, before a child exists.
  const result = await runCheck({ id: 'sensor', description: 'sensor', verify: 'shell:\0' }, process.cwd(), process.cwd());
  expect(result.result?.status).toBe('error');
  expect(observation.calls).toEqual([{ int: before.int + 1, term: before.term + 1 }]);
  expect(process.listenerCount('SIGINT')).toBe(before.int);
  expect(process.listenerCount('SIGTERM')).toBe(before.term);
});
