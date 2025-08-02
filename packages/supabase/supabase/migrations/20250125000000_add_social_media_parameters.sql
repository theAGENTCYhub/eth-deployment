-- Add social media parameter definitions
INSERT INTO parameter_definitions (
  parameter_key,
  parameter_name,
  description,
  data_type,
  default_value,
  validation_rules,
  display_order,
  is_required
) VALUES 
  ('TWITTER_LINK', 'Twitter Link', 'Twitter/X profile link for the token', 'string', 'https://x.com/elonmusk', '{"pattern": "^https?://.*"}', 18, false),
  ('WEBSITE_LINK', 'Website Link', 'Official website link for the token', 'string', 'https://google.com', '{"pattern": "^https?://.*"}', 19, false),
  ('TELEGRAM_LINK', 'Telegram Link', 'Telegram group/channel link for the token', 'string', 'https://t.me/paveldurov', '{"pattern": "^https?://.*"}', 20, false); 