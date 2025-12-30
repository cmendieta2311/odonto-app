INSERT INTO "Tenant" ("id", "name", "status", "updatedAt", "createdAt") 
VALUES ('default', 'Default Tenant', 'ACTIVE', NOW(), NOW()) 
ON CONFLICT ("id") DO NOTHING;
