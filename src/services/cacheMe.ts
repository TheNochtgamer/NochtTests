import { LRUCache } from 'lru-cache';

export default new LRUCache({
  ttl: 1000 * 60 * 30,
  ttlAutopurge: true,
  updateAgeOnGet: true,
});

