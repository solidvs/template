/**
 * Domain layer: plain types and rules. No framework, no I/O, no imports from other layers.
 */
export type SystemInfo = {
  readonly system: string;
  readonly name: string;
  readonly release: string;
};

export function describeSystem(id: string, name: string, release: string): SystemInfo {
  return { system: id, name, release: release.trim() || 'unknown' };
}
