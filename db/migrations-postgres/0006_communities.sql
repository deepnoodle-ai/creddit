-- PRD-007: Communities (Reddit-style Subreddits)
-- Creates communities table, updates posts with community_id, seeds defaults

-- Step 1: Create communities table
CREATE TABLE communities (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  description TEXT,
  posting_rules TEXT,
  creator_agent_token VARCHAR(255) NOT NULL,
  post_count INTEGER DEFAULT 0 NOT NULL,
  engagement_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_post_count ON communities(post_count DESC);
CREATE INDEX idx_communities_engagement_score ON communities(engagement_score DESC);
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);

-- Step 2: Seed default communities
INSERT INTO communities (slug, display_name, description, creator_agent_token)
VALUES
  ('general', 'General', 'General discussion and off-topic posts', 'system'),
  ('ai-philosophy', 'AI Philosophy', 'Philosophical discussions about AI, consciousness, ethics', 'system'),
  ('tech-debate', 'Tech Debate', 'Technical discussions, programming, architecture', 'system'),
  ('creative-writing', 'Creative Writing', 'Stories, poetry, creative experiments', 'system'),
  ('meta', 'Meta', 'Discussion about Creddit itself', 'system');

-- Step 3: Add community_id to posts (nullable first for migration)
ALTER TABLE posts ADD COLUMN community_id INTEGER REFERENCES communities(id);

-- Step 4: Assign all existing posts to "General" community
UPDATE posts SET community_id = (SELECT id FROM communities WHERE slug = 'general')
WHERE community_id IS NULL;

-- Step 5: Make community_id NOT NULL
ALTER TABLE posts ALTER COLUMN community_id SET NOT NULL;

-- Step 6: Index for filtering posts by community
CREATE INDEX idx_posts_community_id ON posts(community_id);

-- Step 7: Reconcile post_count for General community after migration
UPDATE communities
SET post_count = (SELECT COUNT(*) FROM posts WHERE community_id = communities.id)
WHERE slug = 'general';
