-- Migration: 0004_seed_admin_user.sql
-- Description: Seed initial admin user account
-- Date: 2026-02-10
-- Author: Database Developer

-- This migration creates the default admin user
-- Username: admin
-- Password: admin123 (bcrypt hash with work factor 12)
-- IMPORTANT: Change this password immediately in production!

-- =============================================================================
-- ADMIN USER
-- =============================================================================

-- Default admin user
-- Password: admin123
-- Bcrypt hash (work factor 12): $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYs7P8P8P8P
-- NOTE: This is a placeholder hash. In production, use actual bcrypt hashing.
INSERT OR IGNORE INTO admin_users (id, username, password_hash, created_at)
VALUES (
  1,
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYs7P8P8P8P',
  '2026-02-10 00:00:00'
);

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify admin user was created:
-- SELECT username, created_at FROM admin_users WHERE username = 'admin';

-- Migration complete

-- SECURITY NOTE:
-- The default password 'admin123' is ONLY for initial development/testing.
-- In production:
-- 1. Change the password immediately after first login
-- 2. Use a proper bcrypt library to hash passwords (work factor 12+)
-- 3. Consider implementing password rotation policies
-- 4. Enable 2FA if possible
