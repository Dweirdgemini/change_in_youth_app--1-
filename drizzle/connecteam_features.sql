-- Connecteam-Inspired Features Migration
-- Add new tables for pay rates, payslips, admin notes, onboarding packs, and activity log

-- Pay Rates Table
CREATE TABLE IF NOT EXISTS `pay_rates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `hourlyRate` decimal(10, 2),
  `sessionRate` decimal(10, 2),
  `effectiveDate` timestamp NOT NULL,
  `notes` text,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payslips Table
CREATE TABLE IF NOT EXISTS `payslips` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `payPeriodStart` timestamp NOT NULL,
  `payPeriodEnd` timestamp NOT NULL,
  `grossAmount` decimal(10, 2) NOT NULL,
  `netAmount` decimal(10, 2) NOT NULL,
  `fileUrl` varchar(500) NOT NULL,
  `uploadedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin Notes Table
CREATE TABLE IF NOT EXISTS `admin_notes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `note` text NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Onboarding Packs Table
CREATE TABLE IF NOT EXISTS `onboarding_packs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text,
  `role` enum('admin', 'finance', 'facilitator', 'student') NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Onboarding Pack Documents Junction Table
CREATE TABLE IF NOT EXISTS `onboarding_pack_documents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `packId` int NOT NULL,
  `documentId` int NOT NULL,
  `orderIndex` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Activity Log Table
CREATE TABLE IF NOT EXISTS `user_activity_log` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `actionType` varchar(100) NOT NULL,
  `actionDescription` text NOT NULL,
  `entityType` varchar(50),
  `entityId` int,
  `metadata` json,
  `performedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
