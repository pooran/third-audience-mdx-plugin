interface VisitRecord {
    timestamp: string;
    bot_name: string | null;
    bot_category: string;
    detection_method: string;
    confidence: string;
    url: string;
    ip: string;
    country: string | null;
    user_agent: string;
    referer: string | null;
    response_ms: number | null;
    cache_hit: boolean;
    content_length: number | null;
}

interface CitationRecord {
    timestamp: string;
    platform: string;
    query: string | null;
    url: string;
    ip: string;
    user_agent: string;
    referer: string;
}

interface AdminRecord {
    passwordHash: string;
    isDefaultPassword: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    apiKey?: string;
}
interface BotsConfig {
    allowlist: string[];
    blocklist: string[];
    track_unknown: boolean;
}
interface CacheEntry {
    content: string;
    etag: string;
    cachedAt: number;
    ttl: number;
}
interface Store {
    getAdmin(): Promise<AdminRecord | null>;
    saveAdmin(record: AdminRecord): Promise<void>;
    getBotsConfig(): Promise<BotsConfig>;
    saveBotsConfig(config: BotsConfig): Promise<void>;
    appendVisit(record: VisitRecord): Promise<void>;
    getVisits(sinceIso: string): Promise<VisitRecord[]>;
    appendCitation(record: CitationRecord): Promise<void>;
    getCitations(sinceIso: string): Promise<CitationRecord[]>;
    getAllCitations(): Promise<CitationRecord[]>;
    getCache(key: string): Promise<CacheEntry | null>;
    setCache(key: string, entry: CacheEntry): Promise<void>;
    deleteCache(keyPrefix: string): Promise<void>;
    getKv(key: string): Promise<string | null>;
    setKv(key: string, value: string): Promise<void>;
}

declare function getStore(): Store;

declare function generateDefaultPassword(): string;
declare function hashPassword(password: string): string;
declare const DEFAULT_PASSWORD = "Chang3M3Now!";
declare function loadAdmin(): Promise<AdminRecord | null>;
declare function saveAdmin(record: Parameters<ReturnType<typeof getStore>['saveAdmin']>[0]): Promise<void>;
declare function initAdmin(): Promise<{
    password: string;
    apiKey: string;
    isNew: boolean;
}>;
declare function verifyPassword(password: string): Promise<boolean>;
declare function updatePassword(newPassword: string): Promise<void>;
declare function recordLogin(): Promise<void>;
declare function encryptApiKey(plaintext: string): string;
declare function decryptApiKey(encoded: string): string | null;
declare function generateApiKey(): string;
declare function getApiKey(): Promise<string | null>;
declare function rotateApiKey(): Promise<string>;
declare function verifyApiKey(key: string): Promise<boolean>;
declare function signSession(payload: string): string;
declare function verifySession(token: string): boolean;

export { type AdminRecord, DEFAULT_PASSWORD, decryptApiKey, encryptApiKey, generateApiKey, generateDefaultPassword, getApiKey, hashPassword, initAdmin, loadAdmin, recordLogin, rotateApiKey, saveAdmin, signSession, updatePassword, verifyApiKey, verifyPassword, verifySession };
