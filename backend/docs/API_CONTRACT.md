# API Contract Summary

Base URL: `http://localhost:4000` (or `PORT` from env).  
Authentication: **Bearer token** (access token) in `Authorization: Bearer <token>`.  
Refresh token is stored in **HttpOnly cookie** `refreshToken` (set on login).

---

## Auth

### POST /auth/login

**Request**

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Response** `201`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "isActive": true,
    "clientCompanyId": null
  }
}
```

- Sets **HttpOnly, Secure** cookie `refreshToken` with long-lived refresh JWT.

---

### POST /auth/refresh

**Request**  
No body. Sends cookie `refreshToken` automatically.

**Response** `200`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/logout

**Request**  
`Authorization: Bearer <accessToken>`.

**Response** `204`  
Clears `refreshToken` cookie.

---

### GET /auth/profile

**Request**  
`Authorization: Bearer <accessToken>`.

**Response** `200`

```json
{
  "id": "uuid",
  "name": "Admin",
  "email": "admin@example.com",
  "role": "ADMIN",
  "isActive": true,
  "clientCompanyId": null
}
```

---

## Users (ADMIN only)

### POST /users

**Request**  
`Authorization: Bearer <accessToken>` (ADMIN).

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "EMPLOYEE"
}
```

For CLIENT:

```json
{
  "name": "Acme User",
  "email": "acme@example.com",
  "password": "SecurePass123!",
  "role": "CLIENT",
  "clientCompanyId": "uuid-company"
}
```

**Response** `201`

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "EMPLOYEE",
  "isActive": true,
  "clientCompanyId": null,
  "createdAt": "2024-02-22T12:00:00.000Z",
  "updatedAt": "2024-02-22T12:00:00.000Z"
}
```

---

## Projects (role-scoped)

### GET /projects

**Request**  
`Authorization: Bearer <accessToken>`.

- **ADMIN**: all projects.
- **EMPLOYEE**: projects where the user is assigned.
- **CLIENT**: projects of the user’s company (`clientCompanyId`).

**Response** `200`

```json
[
  {
    "id": "uuid",
    "name": "Website Redesign",
    "description": null,
    "clientId": "uuid",
    "status": "IN_PROGRESS",
    "createdAt": "2024-02-22T12:00:00.000Z",
    "updatedAt": "2024-02-22T12:00:00.000Z",
    "client": { "id": "uuid", "name": "Acme Inc" },
    "assignments": []
  }
]
```

---

### POST /projects/:id/assign

**Request**  
`Authorization: Bearer <accessToken>` (ADMIN).

```json
{
  "employeeIds": ["uuid-employee-1", "uuid-employee-2"]
}
```

**Response** `200`  
Project with updated `assignments`.

---

## Service requests

### POST /service-requests (CLIENT only)

**Request**  
`Authorization: Bearer <accessToken>` (CLIENT; user must have `clientCompanyId`).

```json
{
  "serviceId": "uuid-service",
  "details": "Need implementation by Q2"
}
```

**Response** `201`

```json
{
  "id": "uuid",
  "clientId": "uuid",
  "serviceId": "uuid",
  "status": "PENDING",
  "details": "Need implementation by Q2",
  "createdAt": "2024-02-22T12:00:00.000Z",
  "updatedAt": "2024-02-22T12:00:00.000Z",
  "service": { "id": "uuid", "name": "Consulting", "price": "100.00" },
  "client": { "id": "uuid", "name": "Acme Inc" }
}
```

---

### PATCH /service-requests/:id/approve (ADMIN only)

**Request**  
`Authorization: Bearer <accessToken>` (ADMIN).

**Response** `200`  
Updated service request with `status: "APPROVED"`.

---

## Messages (authenticated)

### POST /messages

**Request**  
`Authorization: Bearer <accessToken>`.

```json
{
  "receiverId": "uuid-user",
  "content": "Hello, when is the next meeting?"
}
```

**Response** `201`

```json
{
  "id": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "content": "Hello, when is the next meeting?",
  "createdAt": "2024-02-22T12:00:00.000Z",
  "sender": { "id": "uuid", "name": "Admin", "email": "admin@example.com" },
  "receiver": { "id": "uuid", "name": "Jane", "email": "jane@example.com" }
}
```

---

## Error responses

- **400** Validation error: `{ "statusCode": 400, "message": ["..."], "error": "Bad Request" }`
- **401** Unauthorized: invalid or missing access token.
- **403** Forbidden: insufficient role or permission.
- **404** Not found.
- **409** Conflict (e.g. email already exists).

All errors use the same shape: `statusCode`, `message` (array of strings), `error`.
