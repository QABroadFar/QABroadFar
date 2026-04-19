-- Change due_date from DATE to INTEGER (day of month)
ALTER TABLE recurring_payments DROP COLUMN IF EXISTS due_date;
ALTER TABLE recurring_payments ADD COLUMN due_date INTEGER;

SELECT 'Due date column fixed to INTEGER!' as status;
