-- Fix the short_id trigger to handle empty strings
DROP TRIGGER IF EXISTS set_short_id_transactions ON transactions;

CREATE TRIGGER set_short_id_transactions
BEFORE INSERT ON transactions
FOR EACH ROW
WHEN (NEW.short_id IS NULL OR NEW.short_id = '')
EXECUTE FUNCTION generate_short_id_transactions(); 