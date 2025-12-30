
INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt", "tenantId")
VALUES (
  'user-debug-001', 
  'test_debug@test.com', 
  '$2b$10$1d/Mgb7sEgvSlB.6.JhxT.IDLfUHRfXBWtwhx4VszsgIyNn4fvjYW', 
  'Debug User', 
  'ADMIN', 
  NOW(), 
  NOW(), 
  'default'
)
ON CONFLICT ("email") DO UPDATE SET "password" = '$2b$10$1d/Mgb7sEgvSlB.6.JhxT.IDLfUHRfXBWtwhx4VszsgIyNn4fvjYW';
