// @flow

export interface ServerManagerInterface {
  clearSpawnErrors(): void,
  close(): Promise<void>,
  isRunning(): boolean,
  lastSpawnErrors(): Array<Error>,
  manage(serverCode: string, bundleDirectory: string): Promise<void>,
}
