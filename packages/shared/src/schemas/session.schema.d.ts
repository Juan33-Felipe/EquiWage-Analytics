import type { ProjectSessionPayload } from '../types/domain.types.js';

export declare function validateSessionPayload(
  payload: unknown
):
  | { ok: true; session: ProjectSessionPayload }
  | { ok: false; errorKey: string; message: string };
