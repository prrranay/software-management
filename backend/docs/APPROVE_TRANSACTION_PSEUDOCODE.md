# Approve Service Request — Transaction Pseudocode

When an ADMIN approves a service request, the following must run in a **single Prisma transaction**:

1. Set `ServiceRequest.status = APPROVED`
2. Create a new `Project` with:
   - `name` = `"<Service.name> for <Client.name>"`
   - `description` = request's `details`
   - `clientId` = request's `clientId`
   - `status` = `NOT_STARTED`
3. Return the created Project (not the service request).

## Prisma `$transaction` pseudocode

```ts
// Load request with service and client (for name/description)
const req = await prisma.serviceRequest.findUnique({
  where: { id: requestId },
  include: { service: true, client: true },
});
if (!req || req.status === 'APPROVED') throw BadRequest();

const projectName = `${req.service.name} for ${req.client.name}`;

const project = await prisma.$transaction(async (tx) => {
  // 1. Update service request
  await tx.serviceRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED' },
  });

  // 2. Create project in same transaction
  const newProject = await tx.project.create({
    data: {
      name: projectName,
      description: req.details ?? null,
      clientId: req.clientId,
      status: 'NOT_STARTED',
    },
    include: { client: true },
  });

  return newProject;
});

return project; // 3. Return created project
```

## Why a transaction?

- **Atomicity**: If project creation fails, the request is not marked APPROVED.
- **Consistency**: No state where the request is approved but no project exists.
- **Isolation**: Concurrent approve calls do not interleave updates incorrectly.

Implementation: `backend/src/service-requests/service-requests.service.ts` → `approve(id)`.
