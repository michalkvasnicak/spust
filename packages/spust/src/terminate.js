// @flow

import kill from 'terminate';

export default function terminate(
  pid: number,
  timeout?: number = 30000,
  signal?: string = 'SIGTERM',
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      kill(pid, signal, { timeout }, (e: ?Error) => (e ? reject(e) : resolve()));
    } catch (e) {
      reject(e);
    }
  });
}
