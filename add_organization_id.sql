-- Add organizationId to all major tables for multi-tenancy

-- Create organizations table first
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#0a7ea4',
  subscription_tier ENUM('trial', 'starter', 'professional', 'enterprise', 'custom') DEFAULT 'trial' NOT NULL,
  subscription_status ENUM('trial', 'active', 'past_due', 'suspended', 'cancelled') DEFAULT 'trial' NOT NULL,
  trial_ends_at TIMESTAMP NULL,
  billing_email VARCHAR(320) NOT NULL,
  max_users INT DEFAULT 10 NOT NULL,
  max_projects INT DEFAULT 50,
  max_storage_gb INT DEFAULT 10,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  onboarding_step INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create organization_features table
CREATE TABLE IF NOT EXISTS organization_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  feature_slug VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default organization (Change In Youth)
INSERT INTO organizations (id, name, slug, billing_email, subscription_tier, subscription_status, max_users, max_projects, onboarding_completed)
VALUES (1, 'Change In Youth CIC', 'change-in-youth', 'admin@changeinyouth.app', 'enterprise', 'active', 999, 999, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Add organization_id to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE consent_forms ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE program_registrations ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1 AFTER id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_org ON consent_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_participants_org ON participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_registrations_org ON program_registrations(organization_id);
