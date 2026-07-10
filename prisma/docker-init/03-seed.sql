-- Seed database with demo user and sample companies
-- This runs automatically when the database container is first created

-- Create demo user (password: MarketWhisper2026!)
INSERT INTO "User" (id, email, name, password, "emailVerified", image, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'demo@marketwhisper.com',
    'Demo User',
    '$2b$12$SJoQ3dEQR1q8XSlTr/SpseuggZG01Eo.Fn96EARN99RYFraKx5xVO',
    NULL,
    NULL,
    now(),
    now()
);

-- Create sample companies
INSERT INTO "Company" (id, ticker, name, description, sector, industry, "marketCap", website, "logoUrl", "avgSentimentScore", "avgReliabilityScore", "analysisCount", "createdAt", "updatedAt")
VALUES 
    (
        gen_random_uuid()::text,
        'AAPL',
        'Apple Inc.',
        'Technology company that designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
        'Technology',
        'Consumer Electronics',
        2800000000000,
        'https://www.apple.com',
        NULL,
        NULL,
        NULL,
        0,
        now(),
        now()
    ),
    (
        gen_random_uuid()::text,
        'MSFT',
        'Microsoft Corporation',
        'Technology company that develops, licenses, and supports software, services, devices, and solutions.',
        'Technology',
        'Software',
        2400000000000,
        'https://www.microsoft.com',
        NULL,
        NULL,
        NULL,
        0,
        now(),
        now()
    ),
    (
        gen_random_uuid()::text,
        'GOOGL',
        'Alphabet Inc.',
        'Technology company specializing in Internet-related services and products.',
        'Technology',
        'Internet Content & Information',
        1700000000000,
        'https://www.google.com',
        NULL,
        NULL,
        NULL,
        0,
        now(),
        now()
    );
