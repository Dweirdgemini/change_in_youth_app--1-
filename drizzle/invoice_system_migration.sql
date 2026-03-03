-- Add code field to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

-- Update invoices table structure
ALTER TABLE invoices 
  MODIFY COLUMN projectId INT NOT NULL,
  ADD COLUMN IF NOT EXISTS totalAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dueDate TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS submittedAt TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL,
  MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'rejected', 'paid') DEFAULT 'draft';

-- Create session_types table
CREATE TABLE IF NOT EXISTS session_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  leadFacilitatorRate DECIMAL(10,2),
  supportFacilitatorRate DECIMAL(10,2),
  hourlyRate DECIMAL(10,2),
  description TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId INT NOT NULL,
  budgetLineId INT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  sessionId INT,
  expenseId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  projectId INT NOT NULL,
  budgetLineId INT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  receiptUrl VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approvedBy INT,
  approvedAt TIMESTAMP NULL,
  expenseDate TIMESTAMP NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create session_content table
CREATE TABLE IF NOT EXISTS session_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId INT NOT NULL,
  userId INT NOT NULL,
  contentType VARCHAR(50) NOT NULL,
  contentUrl VARCHAR(500) NOT NULL,
  caption TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reviewedBy INT,
  reviewedAt TIMESTAMP NULL,
  publishedAt TIMESTAMP NULL,
  views INT NOT NULL DEFAULT 0,
  reach INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create video_call_attendance table
CREATE TABLE IF NOT EXISTS video_call_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId INT NOT NULL,
  userId INT NOT NULL,
  joinedAt TIMESTAMP NOT NULL,
  leftAt TIMESTAMP NULL,
  durationMinutes INT,
  calculatedPayment DECIMAL(10,2),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create consent_forms table
CREATE TABLE IF NOT EXISTS consent_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participantId INT NOT NULL,
  formUrl VARCHAR(500) NOT NULL,
  signedAt TIMESTAMP NULL,
  expiresAt TIMESTAMP NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default session types
INSERT INTO session_types (name, hourlyRate, description) VALUES
('Team Meeting', 18.00, 'Regular team meetings - £18/hour'),
('Workshop Delivery - Lead', 60.00, 'Lead facilitator for workshop delivery - £60 per session'),
('Workshop Delivery - Support', 40.00, 'Support facilitator for workshop delivery - £40 per session')
ON DUPLICATE KEY UPDATE name=name;
