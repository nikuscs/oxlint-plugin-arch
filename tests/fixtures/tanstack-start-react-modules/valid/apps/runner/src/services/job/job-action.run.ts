import type { JobParams } from '../../types/job.types';

export function jobActionRun(params: JobParams) {
  if (!params.text) {
    return 'EMPTY';
  }

  return params.text.trim().toUpperCase();
}
