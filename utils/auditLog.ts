import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptObject, decryptObject, isEncryptedData, generateSecureId } from './encryption';

const AUDIT_LOG_KEY = 'aura_gold_audit_log_encrypted';
const MAX_AUDIT_ENTRIES = 1000;
const AUDIT_RETENTION_DAYS = 365;

export type AuditEventType =
  | 'PHI_ACCESS'
  | 'PHI_CREATE'
  | 'PHI_UPDATE'
  | 'PHI_DELETE'
  | 'PHI_EXPORT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'SESSION_TIMEOUT'
  | 'CONSENT_SIGNED'
  | 'CONSENT_REVOKED'
  | 'TREATMENT_SIGNOFF'
  | 'ENCRYPTION_KEY_ROTATION'
  | 'DATA_MIGRATION';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  userRole: 'patient' | 'staff' | 'system';
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'failure' | 'denied';
  details?: Record<string, unknown>;
  phiAccessed?: boolean;
}

interface SerializedAuditLogEntry extends Omit<AuditLogEntry, 'timestamp'> {
  timestamp: string;
}

let auditCache: AuditLogEntry[] = [];
let isInitialized = false;

const sanitizeForLog = (data: unknown): unknown => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    if (data.length > 100) {
      return `[REDACTED: ${data.length} chars]`;
    }
    const sensitivePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      /\b\d{9}\b/g,
    ];
    
    let sanitized = data;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForLog);
  }
  
  if (typeof data === 'object') {
    const sensitiveKeys = [
      'phone', 'email', 'ssn', 'dob', 'dateOfBirth', 'address',
      'patientSignature', 'providerSignature', 'signature',
      'password', 'token', 'key', 'secret', 'credential',
      'name', 'patientName', 'firstName', 'lastName',
    ];
    
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

export const initializeAuditLog = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    const stored = await AsyncStorage.getItem(AUDIT_LOG_KEY);
    if (stored) {
      let entries: SerializedAuditLogEntry[];
      if (isEncryptedData(stored)) {
        entries = await decryptObject<SerializedAuditLogEntry[]>(stored);
      } else {
        entries = JSON.parse(stored);
      }
      
      auditCache = entries.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
      
      await pruneOldEntries();
    }
    isInitialized = true;
    console.log('[AuditLog] Initialized with', auditCache.length, 'entries');
  } catch (error) {
    console.log('[AuditLog] Error initializing:', error);
    auditCache = [];
    isInitialized = true;
  }
};

const pruneOldEntries = async (): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - AUDIT_RETENTION_DAYS);
  
  const originalCount = auditCache.length;
  auditCache = auditCache.filter(entry => entry.timestamp >= cutoffDate);
  
  if (auditCache.length > MAX_AUDIT_ENTRIES) {
    auditCache = auditCache.slice(-MAX_AUDIT_ENTRIES);
  }
  
  if (originalCount !== auditCache.length) {
    await persistAuditLog();
    console.log('[AuditLog] Pruned', originalCount - auditCache.length, 'old entries');
  }
};

const persistAuditLog = async (): Promise<void> => {
  try {
    const serialized: SerializedAuditLogEntry[] = auditCache.map(e => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    }));
    const encrypted = await encryptObject(serialized);
    await AsyncStorage.setItem(AUDIT_LOG_KEY, encrypted);
  } catch (error) {
    console.log('[AuditLog] Error persisting:', error);
  }
};

export const logAuditEvent = async (
  eventType: AuditEventType,
  action: string,
  options: {
    userId?: string;
    userRole?: 'patient' | 'staff' | 'system';
    resourceType?: string;
    resourceId?: string;
    outcome?: 'success' | 'failure' | 'denied';
    details?: Record<string, unknown>;
    phiAccessed?: boolean;
  } = {}
): Promise<void> => {
  if (!isInitialized) {
    await initializeAuditLog();
  }
  
  const entry: AuditLogEntry = {
    id: await generateSecureId(),
    timestamp: new Date(),
    eventType,
    userRole: options.userRole || 'system',
    action,
    resourceType: options.resourceType,
    resourceId: options.resourceId ? `[ID:${options.resourceId.slice(-6)}]` : undefined,
    outcome: options.outcome || 'success',
    details: options.details ? sanitizeForLog(options.details) as Record<string, unknown> : undefined,
    phiAccessed: options.phiAccessed,
  };
  
  if (options.userId) {
    entry.userId = `[USER:${options.userId.slice(-6)}]`;
  }
  
  auditCache.push(entry);
  
  console.log(`[HIPAA Audit] ${eventType}: ${action} - ${entry.outcome}`);
  
  await persistAuditLog();
};

export const logPHIAccess = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  userRole: 'patient' | 'staff' = 'staff'
): Promise<void> => {
  await logAuditEvent('PHI_ACCESS', action, {
    userRole,
    resourceType,
    resourceId,
    phiAccessed: true,
  });
};

export const logAuthEvent = async (
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'SESSION_TIMEOUT',
  userRole: 'patient' | 'staff',
  details?: Record<string, unknown>
): Promise<void> => {
  await logAuditEvent(eventType, `User ${eventType.toLowerCase().replace('_', ' ')}`, {
    userRole,
    outcome: eventType === 'LOGIN_FAILURE' ? 'failure' : 'success',
    details,
  });
};

export const logConsentEvent = async (
  action: 'signed' | 'revoked' | 'updated',
  patientId?: string,
  consentType: string = 'AI-assisted treatment'
): Promise<void> => {
  await logAuditEvent(
    action === 'revoked' ? 'CONSENT_REVOKED' : 'CONSENT_SIGNED',
    `Patient consent ${action} for ${consentType}`,
    {
      userRole: 'patient',
      resourceType: 'consent',
      resourceId: patientId,
      phiAccessed: true,
    }
  );
};

export const getAuditLog = async (
  options: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: AuditEventType[];
    userRole?: 'patient' | 'staff' | 'system';
    phiOnly?: boolean;
    limit?: number;
  } = {}
): Promise<AuditLogEntry[]> => {
  if (!isInitialized) {
    await initializeAuditLog();
  }
  
  await logAuditEvent('PHI_ACCESS', 'Audit log accessed', {
    userRole: 'staff',
    resourceType: 'audit_log',
    phiAccessed: true,
  });
  
  let filtered = [...auditCache];
  
  if (options.startDate) {
    filtered = filtered.filter(e => e.timestamp >= options.startDate!);
  }
  if (options.endDate) {
    filtered = filtered.filter(e => e.timestamp <= options.endDate!);
  }
  if (options.eventTypes?.length) {
    filtered = filtered.filter(e => options.eventTypes!.includes(e.eventType));
  }
  if (options.userRole) {
    filtered = filtered.filter(e => e.userRole === options.userRole);
  }
  if (options.phiOnly) {
    filtered = filtered.filter(e => e.phiAccessed);
  }
  
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  
  return filtered;
};

export const getAuditSummary = async (): Promise<{
  totalEntries: number;
  phiAccessCount: number;
  loginAttempts: { success: number; failure: number };
  consentEvents: number;
  lastActivity?: Date;
}> => {
  if (!isInitialized) {
    await initializeAuditLog();
  }
  
  const phiAccessCount = auditCache.filter(e => e.phiAccessed).length;
  const loginSuccess = auditCache.filter(e => e.eventType === 'LOGIN_SUCCESS').length;
  const loginFailure = auditCache.filter(e => e.eventType === 'LOGIN_FAILURE').length;
  const consentEvents = auditCache.filter(
    e => e.eventType === 'CONSENT_SIGNED' || e.eventType === 'CONSENT_REVOKED'
  ).length;
  const lastEntry = auditCache[auditCache.length - 1];
  
  return {
    totalEntries: auditCache.length,
    phiAccessCount,
    loginAttempts: { success: loginSuccess, failure: loginFailure },
    consentEvents,
    lastActivity: lastEntry?.timestamp,
  };
};

export const exportAuditLog = async (
  startDate: Date,
  endDate: Date
): Promise<string> => {
  const entries = await getAuditLog({ startDate, endDate });
  
  await logAuditEvent('PHI_EXPORT', 'Audit log exported', {
    userRole: 'staff',
    resourceType: 'audit_log',
    details: {
      entriesExported: entries.length,
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    },
    phiAccessed: true,
  });
  
  const exportData = entries.map(e => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
  }));
  
  return JSON.stringify(exportData, null, 2);
};

export const clearAuditLog = async (): Promise<void> => {
  await logAuditEvent('PHI_DELETE', 'Audit log cleared', {
    userRole: 'staff',
    resourceType: 'audit_log',
    details: { entriesCleared: auditCache.length },
  });
  
  auditCache = [];
  await AsyncStorage.removeItem(AUDIT_LOG_KEY);
  console.log('[AuditLog] Cleared');
};

export const sanitizeConsoleLog = (message: string, data?: unknown): void => {
  const sanitizedData = data ? sanitizeForLog(data) : undefined;
  if (sanitizedData !== undefined) {
    console.log(message, sanitizedData);
  } else {
    console.log(message);
  }
};
