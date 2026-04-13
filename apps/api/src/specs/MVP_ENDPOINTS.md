```markdown
# MVP API Endpoints Specification

This document outlines the RESTful API endpoints for the initial Minimum Viable Product (MVP) release of the application.

## Base URL
`https://api.v1.example.com`

## Authentication

### POST /auth/register
Registers a new user account.
- **Request Body**: `{ "email": "string", "password": "string", "name": "string" }`
- **Response**: `201 Created` - `{ "id": "uuid", "email": "string", "token": "jwt" }`

### POST /auth/login
Authenticates a user and returns a session token.
- **Request Body**: `{ "email": "string", "password": "string" }`
- **Response**: `200 OK` - `{ "token": "jwt", "user": { "id": "uuid", "name": "string" } }`

### POST /auth/logout
Invalidates the current session token.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `204 No Content`

### POST /auth/refresh
Generates a new JWT token using a valid refresh token.
- **Request Body**: `{ "refreshToken": "string" }`
- **Response**: `200 OK` - `{ "token": "jwt" }`

## User Management

### GET /users/me
Retrieves the profile information of the currently authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - `{ "id": "uuid", "email": "string", "name": "string", "avatarUrl": "url" }`

### PATCH /users/me
Updates the profile information for the current user.
- **Request Body**: `{ "name": "string", "avatarUrl": "url" }`
- **Response**: `200 OK` - `{ "id": "uuid", "name": "string" }`

## Projects

### GET /projects
Returns a list of projects the user has access to.
- **Query Params**: `limit=int`, `offset=int`
- **Response**: `200 OK` - `[{ "id": "uuid", "name": "string", "status": "active" }]`

### POST /projects
Creates a new project.
- **Request Body**: `{ "name": "string", "description": "string" }`
- **Response**: `201 Created` - `{ "id": "uuid", "name": "string" }`

### GET /projects/:id
Retrieves detailed information about a specific project.
- **Response**: `200 OK` - `{ "id": "uuid", "name": "string", "description": "string", "createdAt": "iso8601" }`

### PATCH /projects/:id
Updates project metadata.
- **Request Body**: `{ "name": "string", "description": "string", "status": "string" }`
- **Response**: `200 OK`

### DELETE /projects/:id
Soft deletes a project.
- **Response**: `204 No Content`

## Tasks

### GET /projects/:projectId/tasks
Retrieves all tasks associated with a project.
- **Query Params**: `status=open|closed`, `assigneeId=uuid`
- **Response**: `200 OK` - `[{ "id": "uuid", "title": "string", "priority": "high" }]`

### POST /projects/:projectId/tasks
Creates a new task within a project.
- **Request Body**: `{ "title": "string", "description": "string", "priority": "string" }`
- **Response**: `201 Created` - `{ "id": "uuid", "projectId": "uuid" }`

### GET /tasks/:id
Retrieves specific task details including sub-tasks and attachments.
- **Response**: `200 OK` - `{ "id": "uuid", "title": "string", "subtasks": [], "attachments": [] }`

### PATCH /tasks/:id
Updates task status, priority, or content.
- **Request Body**: `{ "status": "string", "priority": "string", "assignedTo": "uuid" }`
- **Response**: `200 OK`

### DELETE /tasks/:id
Removes a task permanently.
- **Response**: `204 No Content`

## Comments

### GET /tasks/:taskId/comments
Lists all comments for a specific task.
- **Response**: `200 OK` - `[{ "id": "uuid", "userId": "uuid", "content": "string", "createdAt": "date" }]`

### POST /tasks/:taskId/comments
Adds a new comment to a task.
- **Request Body**: `{ "content": "string" }`
- **Response**: `201 Created`

### DELETE /comments/:id
Deletes a specific comment.
- **Response**: `204 No Content`

## Notifications

### GET /notifications
Retrieves all notifications for the authenticated user.
- **Query Params**: `unreadOnly=boolean`
- **Response**: `200 OK` - `[{ "id": "uuid", "type": "string", "message": "string", "read": false }]`

### PATCH /notifications/:id/read
Marks a specific notification as read.
- **Response**: `200 OK`

### POST /notifications/read-all
Marks all user notifications as read.
- **Response**: `204 No Content`

## Assets & Files

### POST /assets/upload
Uploads a file to cloud storage and returns the metadata.
- **Request Body**: `Multipart/form-data (file)`
- **Response**: `201 Created` - `{ "assetId": "uuid", "url": "string" }`

### GET /assets/:id
Retrieves metadata for a specific uploaded asset.
- **Response**: `200 OK` - `{ "id": "uuid", "filename": "string", "size": "int" }`

## Workspace Management

### GET /workspaces
Lists workspaces the user belongs to.
- **Response**: `200 OK` - `[{ "id": "uuid", "name": "string", "role": "admin|member" }]`

### POST /workspaces
Creates a new workspace.
- **Request Body**: `{ "name": "string" }`
- **Response**: `201 Created`

### GET /workspaces/:id/members
Lists all members of a workspace.
- **Response**: `200 OK` - `[{ "userId": "uuid", "name": "string", "role": "string" }]`

### POST /workspaces/:id/invite
Invites a user to a workspace via email.
- **Request Body**: `{ "email": "string", "role": "string" }`
- **Response**: `200 OK`

## Search

### GET /search
Global search across projects, tasks, and users.
- **Query Params**: `q=string`, `type=project|task|user`
- **Response**: `200 OK` - `{ "results": { "projects": [], "tasks": [] } }`

## Settings

### GET /settings
Retrieves user-specific application settings.
- **Response**: `200 OK` - `{ "theme": "light|dark", "emailNotifications": true }`

### PATCH /settings
Updates user settings.
- **Request Body**: `{ "theme": "string", "emailNotifications": "boolean" }`
- **Response**: `200 OK`

## System Health

### GET /health
Check the status of the API and its dependencies.
- **Response**: `200 OK` - `{ "status": "ok", "version": "1.0.0", "uptime": "float" }`

## Error Handling

The API uses standard HTTP status codes:
- `400 Bad Request`: Validation failed.
- `401 Unauthorized`: Authentication required or token expired.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unexpected server error.

Error Response Format:
```json
{
  "error": {
    "code": "string_identifier",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Rate Limiting
- **Standard**: 100 requests per minute per IP.
- **Auth**: 10 requests per minute per IP.

## Pagination
Pagination is handled via `limit` and `offset` query parameters.
- Default `limit`: 20
- Max `limit`: 100

## Versioning
The API version is included in the URL path (e.g., `/api/v1/`). Major breaking changes will result in a new version (e.g., `/api/v2/`).

---
*End of MVP Specification*
```
