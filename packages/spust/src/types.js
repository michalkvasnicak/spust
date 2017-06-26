// @flow

export interface ServerManagerInterface {
  close(): Promise<void>,
  isRunning(): boolean,
  lastSpawnErrors(): Array<Error>,
  manage(serverCode: string, bundleDirectory: string): Promise<void>,
}
