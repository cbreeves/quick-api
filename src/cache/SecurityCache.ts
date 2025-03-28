import { Cache, CacheContainer } from 'node-ts-cache'
import { MemoryStorage } from 'node-ts-cache-storage-memory'

export class SecurityCache {
  private static securityCache?: CacheContainer = undefined
  static DEFAULT_TTL: number = 300

  private static getCache () {
    if (!SecurityCache.securityCache) {
      SecurityCache.securityCache = new CacheContainer(new MemoryStorage())
    }
    return SecurityCache.securityCache
  }
  public static put (key: any, value: any) {
    this.getCache().setItem(key, value, { ttl: SecurityCache.DEFAULT_TTL });
  }
  public static get(key: any): any {
    this.getCache().getItem(key);
  }
}
