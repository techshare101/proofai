# Logging Standards Documentation

## Overview

This document outlines the standardized logging approach implemented across the ProofAI application to replace inconsistent `console.log`/`console.error` usage with a centralized, structured logging system.

## Centralized Logger

### Location
`/lib/logger.ts` - Centralized logging utility

### Features
- **Structured Logging**: Consistent format with timestamps, log levels, and context
- **Environment-Aware**: Different log levels for development vs production
- **Context Support**: Rich context information for debugging and monitoring
- **Service-Specific Methods**: Specialized logging for different application services

### Log Levels
- `ERROR` (0): Critical errors that need immediate attention
- `WARN` (1): Warning conditions that should be monitored
- `INFO` (2): General information about application flow
- `DEBUG` (3): Detailed information for debugging (development only)

## Usage Examples

### Basic Logging
```typescript
import { logger } from '@/lib/logger';

// Error logging with context
logger.error('Database connection failed', error, { 
  component: 'UserService', 
  userId: '123' 
});

// Info logging
logger.info('User authentication successful', { 
  userId: '123', 
  method: 'oauth' 
});

// Debug logging (development only)
logger.debug('Processing user data', { 
  userData: sanitizedUserData 
});
```

### Service-Specific Logging
```typescript
// Transcription service
logger.transcription('Starting audio transcription', { 
  fileSize: '2.5MB', 
  language: 'auto' 
});

// PDF generation
logger.pdf('PDF generation completed', { 
  caseId: 'CASE-123', 
  pageCount: 5 
});

// API requests/responses
logger.apiRequest('POST', '/api/transcribe', { requestId: 'req-123' });
logger.apiResponse('POST', '/api/transcribe', 200, 1500, { requestId: 'req-123' });
```

## Implementation Status

### ✅ Completed Files

#### `/app/api/transcribe/route.ts`
- **Before**: Mixed `console.log`/`console.error` with emoji-based formatting
- **After**: Structured logging with request tracking and proper error handling
- **Key Improvements**:
  - Request ID tracking for debugging
  - Consistent transcription service logging
  - Proper error context with OpenAI API details
  - Development vs production log level handling

#### `/app/components/DashboardView.tsx`
- **Before**: Inconsistent error logging patterns
- **After**: Standardized error handling with component context
- **Key Improvements**:
  - Component-specific error context
  - Operation tracking (deleteReport, deleteFolder)
  - Consistent error reporting for UI operations

#### `/app/services/serverTranscriptionService.ts`
- **Before**: Console-based logging with emoji formatting
- **After**: Service-specific logging with detailed context
- **Key Improvements**:
  - Service identification in logs
  - Input type and processing context
  - Language detection logging
  - Comprehensive error handling

### 🔄 Partially Updated Files

#### Other Components
- Key error handling patterns updated in critical components
- Remaining console.log statements can be gradually migrated
- Focus placed on error-prone operations and API interactions

## Migration Guidelines

### For New Code
1. Always import and use the centralized logger
2. Include relevant context information
3. Use appropriate log levels
4. Avoid console.log/console.error directly

### For Existing Code
1. Replace `console.error()` with `logger.error()`
2. Replace `console.log()` with appropriate level (`logger.info()`, `logger.debug()`)
3. Add context objects for better debugging
4. Remove emoji-based formatting in favor of structured data

## Best Practices

### Error Logging
```typescript
// Good
logger.error('User authentication failed', error, { 
  component: 'AuthService', 
  userId: user.id,
  attemptCount: 3 
});

// Avoid
console.error('❌ Auth failed:', error);
```

### Information Logging
```typescript
// Good
logger.info('PDF generation started', { 
  caseId: 'CASE-123', 
  userId: user.id,
  templateType: 'incident_report' 
});

// Avoid
console.log('🔄 Starting PDF generation for case CASE-123');
```

### Debug Logging
```typescript
// Good (automatically filtered in production)
logger.debug('Processing transcript data', { 
  transcriptLength: transcript.length,
  language: detectedLanguage 
});

// Avoid
console.log('📝 Transcript:', transcript.substring(0, 50) + '...');
```

## Benefits

### Development
- **Consistent Format**: All logs follow the same structure
- **Rich Context**: Detailed information for debugging
- **Request Tracking**: Ability to trace requests across services
- **Environment Awareness**: Appropriate logging for dev vs prod

### Production
- **Structured Data**: Easy to parse and analyze
- **Performance**: Reduced logging overhead in production
- **Monitoring**: Better integration with monitoring tools
- **Security**: Sensitive data handling in log context

### Maintenance
- **Centralized Control**: Single place to modify logging behavior
- **Type Safety**: TypeScript support for log context
- **Consistency**: Uniform logging across the entire application
- **Scalability**: Easy to extend with new log levels or outputs

## Future Enhancements

1. **External Logging**: Integration with services like Winston, Pino, or cloud logging
2. **Log Aggregation**: Centralized log collection for production monitoring
3. **Performance Metrics**: Built-in performance tracking
4. **Alert Integration**: Automatic alerting on error patterns
5. **Log Rotation**: Automatic log file management

## Migration Checklist

- [x] Create centralized logger utility
- [x] Update critical API routes (`/api/transcribe`)
- [x] Update key components (`DashboardView`)
- [x] Update core services (`serverTranscriptionService`)
- [ ] Gradually migrate remaining console.log statements
- [ ] Add performance logging for critical operations
- [ ] Implement log aggregation for production monitoring
