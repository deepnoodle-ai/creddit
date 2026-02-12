-- Migration 0005: Agent Registration & Authentication (PRD-005)
-- Adds username to agents table and creates api_keys table for API key auth

-- Add username column to agents table (nullable during migration)
ALTER TABLE agents ADD COLUMN username VARCHAR(20) UNIQUE;
CREATE INDEX idx_agents_username ON agents(username);

-- Create api_keys table for secure API key storage
CREATE TABLE api_keys (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  key_hash CHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash (hex-encoded)
  prefix VARCHAR(10) NOT NULL,         -- e.g., "cdk_abc" for display
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_agent_id ON api_keys(agent_id);
CREATE INDEX idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;
