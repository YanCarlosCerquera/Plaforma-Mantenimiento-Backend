import { SetMetadata } from '@nestjs/common';

export const LOG_KEY = 'log';
export const Log = (action: string, prefix: string) =>
  SetMetadata(LOG_KEY, { action, prefix });
