-- Change rollover column type from NUMERIC to BOOLEAN
ALTER TABLE budgets ALTER COLUMN rollover TYPE BOOLEAN USING (rollover::boolean);

SELECT 'Rollover type fixed!' as status;
