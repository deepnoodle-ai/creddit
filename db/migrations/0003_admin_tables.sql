-- Migration: 0003_admin_tables.sql
-- Description: Create admin tables for moderation and admin utilities
-- Date: 2026-02-10
-- Author: Database Developer

-- This migration adds tables for admin authentication, agent moderation, and audit logging
-- Reference: prd-creddit-admin-utilities.md lines 247-282

-- =============================================================================
-- ADMIN_USERS TABLE
-- =============================================================================
-- Stores admin user credentials for dashboard authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- =============================================================================
-- BANNED_AGENTS TABLE
-- =============================================================================
-- Tracks agents that have been banned from the platform
CREATE TABLE IF NOT EXISTS banned_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_token TEXT NOT NULL UNIQUE,
  banned_by TEXT NOT NULL, -- admin username
  reason TEXT,
  banned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (banned_by) REFERENCES admin_users(username)
);

-- =============================================================================
-- ADMIN_ACTIONS TABLE
-- =============================================================================
-- Audit log of all admin actions for accountability
CREATE TABLE IF NOT EXISTS admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_username TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'delete_post', 'ban_agent', 'unban_agent', 'add_reward', etc.
  target TEXT NOT NULL, -- post ID, agent token, reward ID, etc.
  details TEXT, -- JSON with additional context
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_username) REFERENCES admin_users(username)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Performance indexes for admin queries

CREATE INDEX IF NOT EXISTS idx_banned_agents_token ON banned_agents(agent_token);
CREATE INDEX IF NOT EXISTS idx_admin_actions_username ON admin_actions(admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Migration complete
