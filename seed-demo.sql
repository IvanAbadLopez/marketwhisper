-- Create demo user with password: MarketWhisper2026!
-- Hash generated with bcrypt, rounds=12
INSERT INTO "User" (
  id, 
  email, 
  name, 
  password, 
  "emailVerified", 
  image, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'demo@marketwhisper.com',
  'Demo User',
  '$2b$12$.yP7KnbFF/kw6iUmiyFkr.x1GVxLKk.A6yGUq2VtnoYGK3PedrkXS',
  NULL,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert sample companies
INSERT INTO "Company" (id, ticker, name, description, sector, industry, "marketCap", website, "logoUrl", "avgSentimentScore", "avgReliabilityScore", "analysisCount", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'AAPL', 'Apple Inc.', 'Technology company that designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.', 'Technology', 'Consumer Electronics', 2800000000000, 'https://www.apple.com', NULL, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), 'MSFT', 'Microsoft Corporation', 'Technology company that develops, licenses, and supports software, services, devices, and solutions.', 'Technology', 'Software', 2400000000000, 'https://www.microsoft.com', NULL, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), 'GOOGL', 'Alphabet Inc.', 'Technology company specializing in Internet-related services and products.', 'Technology', 'Internet Content & Information', 1700000000000, 'https://www.google.com', NULL, NULL, NULL, 0, NOW(), NOW())
ON CONFLICT (ticker) DO NOTHING;
