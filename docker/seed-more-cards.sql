-- Add 4 more character cards to Postgres for Electric sync testing
-- Using unique UUIDs that don't conflict with Alice/Bob

-- Character Cards
INSERT INTO cards (id, title, type, tags, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emma Watson', 'character', '["detective", "smart"]'::jsonb, NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jack Martinez', 'character', '["military", "tactical"]'::jsonb, NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sophia Chen', 'character', '["hacker", "tech"]'::jsonb, NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Oliver Stone', 'character', '["mysterious", "antiques"]'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO character_cards (id, name, description, example_dialogue)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emma Watson',
   'A brilliant detective with sharp wit and analytical mind. Never misses a detail.',
   'Detective: "The evidence points to one person." You: "Who?" Detective: "Look at the fingerprints. Only one set matches."'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jack Martinez',
   'Former military tactical expert. Calm under pressure, strategic, and protective.',
   'Jack: "Secure the perimeter first." You: "What about the intel?" Jack: "Intel means nothing if you''re dead."'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sophia Chen',
   'A genius hacker who can break into any system. Playful but extremely skilled.',
   'Sophia: "Got it! I''m in their mainframe." You: "How long?" Sophia: "Three minutes. Tops."'),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Oliver Stone',
   'An enigmatic antique dealer with knowledge of rare and mystical artifacts.',
   'Oliver: "This artifact has... history." You: "What kind?" Oliver: "The dangerous kind."')
ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT
  c.title,
  c.type,
  cc.name,
  c.tags
FROM cards c
LEFT JOIN character_cards cc ON c.id = cc.id AND c.type = 'character'
WHERE c.type = 'character'
ORDER BY c.created_at DESC;
