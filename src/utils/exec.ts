/**
 * Thin wrappers around execa for command execution
 */

import { execa } from 'execa';
import type { ExecaChildProcess } from 'execa';

export type ExecResult = any;

export interface RunCommandOptions {
  silent?: boolean;
  [key: string]: any;
}

export async function runCommand(
  file: string,
  args: string[] = [],
  options: RunCommandOptions = {}
): Promise<ExecResult> {
  const { silent, ...execaOptions } = options;
  const result = await execa(file, args, execaOptions);

  if (!silent && result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (!silent && result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
}

export function spawnCommand(
  file: string,
  args: string[] = [],
  options: Record<string, any> = {}
): ExecaChildProcess {
  return execa(file, args, {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
    ...options,
  });
}
