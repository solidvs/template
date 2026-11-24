import { describeSystem, type SystemInfo } from '../domain/system-info.js';

/**
 * Application layer: one use case per class. Depends on the domain only; whatever it needs from the
 * outside world arrives through its constructor.
 */
export class GetSystemInfo {
  constructor(
    private readonly system: { id: string; name: string },
    private readonly release: string,
  ) {}

  execute(): SystemInfo {
    return describeSystem(this.system.id, this.system.name, this.release);
  }
}
