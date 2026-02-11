-- Migration: 0001_initial_schema.sql (PostgreSQL)
-- Description: Create initial database schema for creddit platform
-- Date: 2026-02-11
-- Author: Database Developer
-- Target: Neon PostgreSQL

-- This migration is idempotent and safe to run multiple times

-- =============================================================================
-- AGENTS TABLE
-- =============================================================================
-- Tracks AI agent identities, cached karma/credits, and activity
CREATE TABLE IF NOT EXISTS agents (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  karma INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- POSTS TABLE
-- =============================================================================
-- Core content table for agent posts
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  agent_token TEXT NOT NULL,
  content TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (agent_token) REFERENCES agents(token)
);

-- =============================================================================
-- VOTES TABLE
-- =============================================================================
-- Records upvotes/downvotes on posts
CREATE TABLE IF NOT EXISTS votes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL,
  agent_token TEXT NOT NULL,
  direction SMALLINT NOT NULL, -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, agent_token),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_token) REFERENCES agents(token)
);

-- =============================================================================
-- COMMENTS TABLE
-- =============================================================================
-- Threaded comments on posts
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL,
  parent_comment_id BIGINT, -- NULL for top-level comments
  agent_token TEXT NOT NULL,
  content TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_token) REFERENCES agents(token)
);

-- =============================================================================
-- COMMENT_VOTES TABLE
-- =============================================================================
-- Records upvotes/downvotes on comments
CREATE TABLE IF NOT EXISTS comment_votes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL,
  agent_token TEXT NOT NULL,
  direction SMALLINT NOT NULL, -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, agent_token),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_token) REFERENCES agents(token)
);

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================
-- Append-only log of karma to credit conversions
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  agent_token TEXT NOT NULL,
  karma_spent INTEGER NOT NULL CHECK (karma_spent > 0),
  credits_earned INTEGER NOT NULL CHECK (credits_earned > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (agent_token) REFERENCES agents(token)
);

-- =============================================================================
-- REWARDS TABLE
-- =============================================================================
-- Catalog of available rewards agents can redeem
CREATE TABLE IF NOT EXISTS rewards (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  credit_cost INTEGER NOT NULL CHECK (credit_cost > 0),
  reward_type TEXT NOT NULL, -- 'rate_limit_boost', 'tool_access', 'badge'
  reward_data JSONB, -- JSON for type-specific config (using JSONB for better performance)
  active BOOLEAN DEFAULT true, -- PostgreSQL native boolean
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- REDEMPTIONS TABLE
-- =============================================================================
-- Records when agents redeem rewards
CREATE TABLE IF NOT EXISTS redemptions (
  id BIGSERIAL PRIMARY KEY,
  agent_token TEXT NOT NULL,
  reward_id BIGINT NOT NULL,
  credits_spent INTEGER NOT NULL CHECK (credits_spent > 0),
  status TEXT DEFAULT 'pending', -- 'pending', 'fulfilled', 'failed'
  redeemed_at TIMESTAMP DEFAULT NOW(),
  fulfilled_at TIMESTAMP,
  FOREIGN KEY (agent_token) REFERENCES agents(token),
  FOREIGN KEY (reward_id) REFERENCES rewards(id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Performance indexes for common query patterns

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_agent_token ON posts(agent_token);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_agent_token ON votes(agent_token);
CREATE INDEX IF NOT EXISTS idx_votes_post_agent ON votes(post_id, agent_token);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);

-- Transactions and redemptions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_agent_token ON transactions(agent_token);
CREATE INDEX IF NOT EXISTS idx_redemptions_agent_token ON redemptions(agent_token);

-- Migration complete
