// @flow

import condense from 'selective-whitespace';
import netstats from 'netstats';

const platform = process.platform;
const isWindows = platform === 'win32';

type Result = { all: Set<number>, tcp: Set<number>, udp: Set<number> };

function processResult(rows: Array<string>): Result {
  const pidIndex = 1;
  const items = isWindows ? rows : rows.slice(1);
  const result = items.reduce(
    (res, row) => {
      const values: Array<string> = condense(row).split(' ');
      const pid = parseInt(isWindows ? values.pop() : values[pidIndex], 10);

      if (pid === '' || pid === 0 || isNaN(pid)) {
        return res;
      }

      if (values.includes('TCP')) {
        res.tcp.add(pid);
      }

      if (values.includes('UDP')) {
        res.udp.add(pid);
      }

      return res;
    },
    { tcp: new Set(), udp: new Set() },
  );

  return {
    ...result,
    all: new Set([...result.tcp, ...result.udp]),
  };
}

export default function portPid(port: number): Promise<Result> {
  return new Promise((resolve, reject) => {
    netstats(port).then(processResult).then(resolve).catch(() =>
      resolve({
        all: new Set(),
        tcp: new Set(),
        udp: new Set(),
      }),
    );
  });
}

// Example output to parse:

// [MAC] $ lsof -i :8017
/*
 COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
 nc      20661 michael    3u  IPv4 0x3b190d9d07c2c3db      0t0  TCP *:8017 (LISTEN)
 nc      21145 michael    3u  IPv4 0x3b190d9d054773db      0t0  TCP *:8017 (LISTEN)
 Python  21221 michael    3u  IPv4 0x3b190d9ceb8dfd7b      0t0  UDP localhost:8017
 */

// [WIN] $ netstat.exe -a -n -o | findstr :9000

/*
 TCP    0.0.0.0:9000           0.0.0.0:0              LISTENING       5220
 TCP    127.0.0.1:9000         127.0.0.1:62376        ESTABLISHED     5220
 TCP    127.0.0.1:9000         127.0.0.1:62379        ESTABLISHED     5220
 TCP    127.0.0.1:62288        127.0.0.1:9000         TIME_WAIT       0
 TCP    127.0.0.1:62299        127.0.0.1:9000         TIME_WAIT       0
 TCP    127.0.0.1:62376        127.0.0.1:9000         ESTABLISHED     7604
 TCP    127.0.0.1:62378        127.0.0.1:9000         ESTABLISHED     7604
 UDP    127.0.0.1:9000         *:*                                    1240
 */
