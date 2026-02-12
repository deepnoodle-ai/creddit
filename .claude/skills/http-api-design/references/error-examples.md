# RFC 9457 Error Examples

Expanded examples of Problem Details responses for common API scenarios. Use these as templates when implementing error handling.

## Validation Error (400)

Multiple field-level validation failures in a single response. Return all errors at once so clients can fix everything in one retry.

```json
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
X-Request-Id: req_4kM8nP2xQr

{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request body contains invalid fields.",
  "errors": [
    {
      "field": "email",
      "detail": "Must be a valid email address.",
      "pointer": "/data/email"
    },
    {
      "field": "reward_amount.amount",
      "detail": "Must be greater than zero.",
      "pointer": "/data/reward_amount/amount"
    },
    {
      "field": "expires_at",
      "detail": "Must be a future date in ISO 8601 format.",
      "pointer": "/data/expires_at"
    }
  ]
}
```

## Authentication Error (401)

Missing or invalid credentials. Don't reveal whether the key exists — just say it's invalid.

```json
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
X-Request-Id: req_7pR2kL9mNx

{
  "type": "https://api.example.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "The API key provided is invalid or has been revoked."
}
```

## Forbidden (403)

Authenticated but lacking permissions. Include what permission is needed so clients can self-diagnose.

```json
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
X-Request-Id: req_2mK5nP8xQr

{
  "type": "https://api.example.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Your API key does not have permission to create offers.",
  "required_scope": "offers:write"
}
```

## Not Found (404)

Resource doesn't exist. Include the resource type and ID so the client knows exactly what wasn't found.

```json
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
X-Request-Id: req_9xL3mK7pNr

{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "No offer exists with the given ID.",
  "resource_type": "offer",
  "resource_id": "off_8xk2Qp"
}
```

## Conflict (409)

State conflict — the operation can't proceed because of the current resource state.

```json
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
X-Request-Id: req_3kL8mN2pRx

{
  "type": "https://api.example.com/errors/state-conflict",
  "title": "State Conflict",
  "status": 409,
  "detail": "This offer has already been activated and cannot be activated again.",
  "current_status": "active",
  "attempted_action": "activate"
}
```

## Business Rule Violation (422)

The request is syntactically valid but violates a business rule. Use extension fields to give the client actionable data.

```json
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json
X-Request-Id: req_5pN8kL2mRx

{
  "type": "https://api.example.com/errors/insufficient-balance",
  "title": "Insufficient Balance",
  "status": 422,
  "detail": "Your account balance is insufficient to fund this offer.",
  "balance": { "amount": "30.00", "currency": "USD" },
  "required": { "amount": "50.00", "currency": "USD" }
}
```

## Rate Limited (429)

Always include Retry-After. Include rate limit context so the client understands its quota.

```json
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 30
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1739290200
X-Request-Id: req_1mK4nP7xLr

{
  "type": "https://api.example.com/errors/rate-limited",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Retry after 30 seconds.",
  "retry_after": 30
}
```

## Idempotency Mismatch (422)

Client reused an idempotency key with different request parameters.

```json
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json
X-Request-Id: req_8xN2kL5mPr

{
  "type": "https://api.example.com/errors/idempotency-mismatch",
  "title": "Idempotency Key Reused",
  "status": 422,
  "detail": "A request with this idempotency key was already processed with different parameters. Use a new key for a new request."
}
```

## Server Error (500)

Never expose stack traces or internal details. Always include the request ID so support can trace it.

```json
HTTP/1.1 500 Internal Server Error
Content-Type: application/problem+json
X-Request-Id: req_6pR3kL8mNx

{
  "type": "https://api.example.com/errors/internal",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred. Please retry or contact support with the request ID.",
  "request_id": "req_6pR3kL8mNx"
}
```

## Service Unavailable (503)

Temporary overload or maintenance. Always include Retry-After.

```json
HTTP/1.1 503 Service Unavailable
Content-Type: application/problem+json
Retry-After: 120
X-Request-Id: req_2mK7nP4xLr

{
  "type": "https://api.example.com/errors/service-unavailable",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "The service is temporarily unavailable due to high load. Please retry.",
  "retry_after": 120
}
```

## Designing Your Error Type Registry

Define your `type` URIs as a flat registry. Each type maps to one category of problem, not one specific occurrence. Good type URIs:

```
https://api.example.com/errors/validation-failed
https://api.example.com/errors/unauthorized
https://api.example.com/errors/forbidden
https://api.example.com/errors/not-found
https://api.example.com/errors/state-conflict
https://api.example.com/errors/insufficient-balance
https://api.example.com/errors/rate-limited
https://api.example.com/errors/idempotency-mismatch
https://api.example.com/errors/internal
https://api.example.com/errors/service-unavailable
```

Make these URLs resolve to documentation pages that describe the error, its extension fields, and suggested client behavior. This turns every error response into a self-documenting pointer to its own troubleshooting guide.
