# OpenAPI 3.1 Starter Template

A minimal but complete OpenAPI template that follows the conventions in this skill. Copy this as your starting point and expand from here.

## Template

```yaml
openapi: "3.1.0"
info:
  title: My API
  version: "1.0.0"
  description: |
    Brief description of what this API does and who it's for.

    ## Conventions

    - All request and response bodies are JSON (`application/json`)
    - All error responses use RFC 9457 Problem Details (`application/problem+json`)
    - All timestamps are ISO 8601 in UTC (e.g. `2026-02-11T14:30:00Z`)
    - All monetary amounts use `{ amount: string, currency: string }`
    - All IDs are prefixed opaque strings (e.g. `off_8xk2Qp`)
    - Clients MUST ignore unknown fields in responses (tolerant reader)
    - All list endpoints use cursor-based pagination
    - POST requests support idempotency via the `Idempotency-Key` header

servers:
  - url: https://api.example.com
    description: Production

security:
  - bearerAuth: []

paths:
  /offers:
    get:
      operationId: listOffers
      summary: List offers
      tags: [Offers]
      parameters:
        - $ref: "#/components/parameters/Cursor"
        - $ref: "#/components/parameters/Limit"
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive, expired]
          description: Filter by offer status
        - name: merchant_id
          in: query
          schema:
            type: string
          description: Filter by merchant ID
          example: mer_3kLm9x
        - name: sort
          in: query
          schema:
            type: string
            default: "created_at:desc"
          description: "Sort field and direction (e.g. `created_at:desc`)"
      responses:
        "200":
          description: A paginated list of offers
          headers:
            X-Request-Id:
              $ref: "#/components/headers/X-Request-Id"
            X-RateLimit-Limit:
              $ref: "#/components/headers/X-RateLimit-Limit"
            X-RateLimit-Remaining:
              $ref: "#/components/headers/X-RateLimit-Remaining"
            X-RateLimit-Reset:
              $ref: "#/components/headers/X-RateLimit-Reset"
          content:
            application/json:
              schema:
                type: object
                required: [data, has_more]
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Offer"
                  has_more:
                    type: boolean
                  next_cursor:
                    type: string
                    description: Present only when has_more is true
              example:
                data:
                  - offer_id: off_8xk2Qp
                    merchant_name: "Acme Coffee"
                    reward_amount:
                      amount: "5.00"
                      currency: USD
                    status: active
                    created_at: "2026-02-11T14:30:00Z"
                has_more: true
                next_cursor: eyJpZCI6Im9mZl85eUwzUnEifQ
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimited"

    post:
      operationId: createOffer
      summary: Create an offer
      tags: [Offers]
      parameters:
        - $ref: "#/components/parameters/IdempotencyKey"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateOfferRequest"
            example:
              merchant_id: mer_3kLm9x
              reward_type: cashback
              reward_amount:
                amount: "5.00"
                currency: USD
      responses:
        "201":
          description: Offer created
          headers:
            X-Request-Id:
              $ref: "#/components/headers/X-Request-Id"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/Offer"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/RateLimited"

  /offers/{offer_id}:
    get:
      operationId: getOffer
      summary: Get an offer
      tags: [Offers]
      parameters:
        - $ref: "#/components/parameters/OfferId"
      responses:
        "200":
          description: The offer
          headers:
            X-Request-Id:
              $ref: "#/components/headers/X-Request-Id"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/Offer"
        "404":
          $ref: "#/components/responses/NotFound"

    patch:
      operationId: updateOffer
      summary: Update an offer
      tags: [Offers]
      parameters:
        - $ref: "#/components/parameters/OfferId"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateOfferRequest"
      responses:
        "200":
          description: The updated offer
          headers:
            X-Request-Id:
              $ref: "#/components/headers/X-Request-Id"
          content:
            application/json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    $ref: "#/components/schemas/Offer"
        "400":
          $ref: "#/components/responses/ValidationError"
        "404":
          $ref: "#/components/responses/NotFound"

    delete:
      operationId: deleteOffer
      summary: Delete an offer
      tags: [Offers]
      parameters:
        - $ref: "#/components/parameters/OfferId"
      responses:
        "204":
          description: Offer deleted
          headers:
            X-Request-Id:
              $ref: "#/components/headers/X-Request-Id"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: "API key passed as Bearer token: `Authorization: Bearer sk_live_...`"

  parameters:
    OfferId:
      name: offer_id
      in: path
      required: true
      schema:
        type: string
      example: off_8xk2Qp

    Cursor:
      name: cursor
      in: query
      schema:
        type: string
      description: Opaque pagination cursor from a previous response

    Limit:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 25
      description: Maximum number of items to return

    IdempotencyKey:
      name: Idempotency-Key
      in: header
      schema:
        type: string
        format: uuid
      description: "Unique key for idempotent request handling (V4 UUID recommended)"
      example: 550e8400-e29b-41d4-a716-446655440000

  headers:
    X-Request-Id:
      schema:
        type: string
      description: Unique request identifier for tracing
      example: req_4kM8nP2xQr

    X-RateLimit-Limit:
      schema:
        type: integer
      description: Maximum requests allowed in the current window

    X-RateLimit-Remaining:
      schema:
        type: integer
      description: Remaining requests in the current window

    X-RateLimit-Reset:
      schema:
        type: integer
      description: Unix timestamp when the rate limit window resets

  schemas:
    Money:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: string
          description: Decimal amount as a string to avoid floating-point issues
          example: "19.99"
        currency:
          type: string
          description: ISO 4217 currency code
          example: USD
          minLength: 3
          maxLength: 3

    Offer:
      type: object
      required: [offer_id, merchant_id, merchant_name, reward_type, reward_amount, status, created_at, updated_at]
      properties:
        offer_id:
          type: string
          example: off_8xk2Qp
        merchant_id:
          type: string
          example: mer_3kLm9x
        merchant_name:
          type: string
          example: "Acme Coffee"
        reward_type:
          type: string
          enum: [cashback, points, discount]
        reward_amount:
          $ref: "#/components/schemas/Money"
        status:
          type: string
          enum: [active, inactive, expired]
        created_at:
          type: string
          format: date-time
          example: "2026-02-11T14:30:00Z"
        updated_at:
          type: string
          format: date-time
          example: "2026-02-11T15:00:00Z"

    CreateOfferRequest:
      type: object
      required: [merchant_id, reward_type, reward_amount]
      properties:
        merchant_id:
          type: string
          example: mer_3kLm9x
        reward_type:
          type: string
          enum: [cashback, points, discount]
        reward_amount:
          $ref: "#/components/schemas/Money"

    UpdateOfferRequest:
      type: object
      properties:
        reward_amount:
          $ref: "#/components/schemas/Money"
        status:
          type: string
          enum: [active, inactive]

    ProblemDetail:
      type: object
      required: [type, title, status]
      properties:
        type:
          type: string
          format: uri
          description: URI identifying the problem type
        title:
          type: string
          description: Short human-readable summary
        status:
          type: integer
          description: HTTP status code
        detail:
          type: string
          description: Human-readable explanation of this occurrence
        instance:
          type: string
          description: URI identifying this specific occurrence

    ValidationProblemDetail:
      allOf:
        - $ref: "#/components/schemas/ProblemDetail"
        - type: object
          properties:
            errors:
              type: array
              items:
                type: object
                required: [field, detail]
                properties:
                  field:
                    type: string
                  detail:
                    type: string
                  pointer:
                    type: string
                    description: JSON Pointer to the problematic field

  responses:
    ValidationError:
      description: Validation failed
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/ValidationProblemDetail"
          example:
            type: "https://api.example.com/errors/validation-failed"
            title: Validation Failed
            status: 400
            detail: "One or more fields failed validation."
            errors:
              - field: email
                detail: "Must be a valid email address."
                pointer: "/data/email"

    Unauthorized:
      description: Authentication required or invalid
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/ProblemDetail"
          example:
            type: "https://api.example.com/errors/unauthorized"
            title: Unauthorized
            status: 401
            detail: "The API key provided is invalid or has been revoked."

    NotFound:
      description: Resource not found
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/ProblemDetail"
          example:
            type: "https://api.example.com/errors/not-found"
            title: Not Found
            status: 404
            detail: "No resource exists with the given ID."

    UnprocessableEntity:
      description: Business rule violation
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/ProblemDetail"
          example:
            type: "https://api.example.com/errors/business-rule-violation"
            title: "Business Rule Violation"
            status: 422
            detail: "The request could not be processed due to a business constraint."

    RateLimited:
      description: Rate limit exceeded
      headers:
        Retry-After:
          schema:
            type: integer
          description: Seconds to wait before retrying
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/ProblemDetail"
          example:
            type: "https://api.example.com/errors/rate-limited"
            title: Too Many Requests
            status: 429
            detail: "Rate limit exceeded. Retry after 30 seconds."
```

## Usage Notes

This template demonstrates the core conventions. When expanding it:

- Add new resources by following the same pattern (list, create, get, update, delete)
- Reuse `$ref` for shared components — every Money field, every error response, every pagination parameter should point to the same definition
- Add new error types to the `responses` section as reusable references
- Keep examples realistic — they'll show up in generated documentation and client SDKs
- Run `spectral lint openapi.yaml` (or your chosen linter) in CI to catch drift from conventions
