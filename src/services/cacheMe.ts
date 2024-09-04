import { LRUCache } from 'lru-cache';
import { CacheTts } from '@/lib/Enums';

export default new LRUCache({
  ttl: CacheTts.default,
  ttlAutopurge: true,
  updateAgeOnGet: true,
});
