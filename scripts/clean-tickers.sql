-- Clean tickers with $ symbol
BEGIN;

-- Show current tickers with $
SELECT ticker, name FROM "Company" WHERE ticker LIKE '$%';

-- Update Company table
UPDATE "Company" 
SET ticker = REGEXP_REPLACE(ticker, '^\$', '', 'g')
WHERE ticker LIKE '$%';

-- Update Analysis table
UPDATE "Analysis"
SET ticker = REGEXP_REPLACE(ticker, '^\$', '', 'g')
WHERE ticker LIKE '$%';

-- Update CompanyEnrichment table
UPDATE "CompanyEnrichment"
SET ticker = REGEXP_REPLACE(ticker, '^\$', '', 'g')
WHERE ticker LIKE '$%';

-- Show results
SELECT ticker, name FROM "Company" ORDER BY ticker;

COMMIT;
