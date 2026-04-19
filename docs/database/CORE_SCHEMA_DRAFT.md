```sql
-- Core Database Schema Draft
-- Version: 1.0.0
-- Dialect: PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types for Domain Logic
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member',
