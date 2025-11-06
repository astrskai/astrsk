-- Test real-time Electric sync with polling (every 2 seconds)
-- This should appear in the browser automatically within 2 seconds

INSERT INTO cards (id, title, type, tags, created_at, updated_at)
VALUES
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'Maya Stone', 'character', '["archaeologist", "adventurer"]'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO character_cards (id, name, description, example_dialogue)
VALUES
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'Maya Stone',
   'A brilliant archaeologist who uncovers ancient mysteries. Fearless and knowledgeable.',
   'Maya: "This artifact is over 3000 years old." You: "How can you tell?" Maya: "The inscription style. Pre-dynastic period."')
ON CONFLICT (id) DO NOTHING;

-- Verify it was added
SELECT title, type FROM cards WHERE id = 'ffffffff-ffff-ffff-ffff-fffffffffff3';
