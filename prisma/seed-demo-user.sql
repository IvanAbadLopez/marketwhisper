INSERT INTO "User" (id, email, name, password, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'demo-user-' || gen_random_uuid()::text,
  'demo@marketwhisper.com',
  'Demo User',
  '$2b$12$dzI9HQxBFR5SN778.6iE1ObJO7Mq4eLOTNnQTDfF.rgwtAnKN6aPm',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
