CREATE TABLE `admin_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`note` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`event_name` varchar(100) NOT NULL,
	`user_id` int,
	`metadata` json,
	`platform` varchar(20),
	`app_version` varchar(20),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `app_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_chat_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int NOT NULL,
	`user_id` int NOT NULL,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_chat_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consent_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`childFullName` varchar(255) NOT NULL,
	`childDateOfBirth` date NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`yearGroup` varchar(50),
	`parentGuardianFullName` varchar(255) NOT NULL,
	`parentGuardianContactNumber` varchar(50) NOT NULL,
	`parentGuardianEmail` varchar(320) NOT NULL,
	`photographsPermission` boolean NOT NULL DEFAULT false,
	`videoPermission` boolean NOT NULL DEFAULT false,
	`bothPermission` boolean NOT NULL DEFAULT false,
	`noPermission` boolean NOT NULL DEFAULT false,
	`internalUseEvaluation` boolean NOT NULL DEFAULT false,
	`internalUseSafeguarding` boolean NOT NULL DEFAULT false,
	`internalUseTraining` boolean NOT NULL DEFAULT false,
	`externalUseSocialMedia` boolean NOT NULL DEFAULT false,
	`externalUseWebsite` boolean NOT NULL DEFAULT false,
	`externalUsePrintedMaterials` boolean NOT NULL DEFAULT false,
	`externalUseFundingReports` boolean NOT NULL DEFAULT false,
	`externalUseLocalMedia` boolean NOT NULL DEFAULT false,
	`externalUseEducationalPresentations` boolean NOT NULL DEFAULT false,
	`usePermissionType` enum('internal_only','internal_and_external','internal_and_specific'),
	`specificExternalUses` text,
	`identificationType` enum('full_identification','first_name_only','anonymous','no_identification'),
	`thirdPartySharing` boolean NOT NULL DEFAULT false,
	`dataProtectionConfirmed` boolean NOT NULL DEFAULT false,
	`safeguardingConfirmed` boolean NOT NULL DEFAULT false,
	`additionalInformation` text,
	`parentGuardianSignature` text,
	`parentGuardianPrintedName` varchar(255) NOT NULL,
	`consentDate` date NOT NULL,
	`secondParentGuardianSignature` text,
	`secondParentGuardianPrintedName` varchar(255),
	`secondParentConsentDate` date,
	`receivedBy` varchar(255),
	`dateReceived` date,
	`storedIn` varchar(255),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	`expiryDate` date,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consent_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_creator_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`total_submissions` int DEFAULT 0,
	`approved_submissions` int DEFAULT 0,
	`total_likes` int DEFAULT 0,
	`total_views` int DEFAULT 0,
	`total_reach` int DEFAULT 0,
	`total_engagement` int DEFAULT 0,
	`rank` int,
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `content_creator_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dbs_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`certificate_number` varchar(255) NOT NULL,
	`dbs_type` enum('basic','standard','enhanced','enhanced_barred') NOT NULL DEFAULT 'enhanced',
	`issue_date` date NOT NULL,
	`expiry_date` date NOT NULL,
	`status` enum('valid','expiring_soon','expired','pending') NOT NULL DEFAULT 'valid',
	`certificate_url` text,
	`notes` text,
	`renewal_period_years` int NOT NULL DEFAULT 3,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dbs_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliverables_completed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`deliverableType` enum('register','evaluation_form','photos','videos','team_feedback') NOT NULL,
	`fileUrl` varchar(500),
	`notes` text,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverables_completed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `development_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`record_type` enum('skill_assessment','performance_note','milestone','goal') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`added_by` int NOT NULL,
	`completed_date` date,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `development_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`budgetLineId` int NOT NULL,
	`description` text NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`receiptUrl` varchar(500),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`expenseDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funder_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`reportType` varchar(100) NOT NULL,
	`dateFrom` date NOT NULL,
	`dateTo` date NOT NULL,
	`filters` text,
	`generatedBy` int NOT NULL,
	`reportData` text,
	`pdfUrl` varchar(500),
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funder_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`budgetLineId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`sessionId` int,
	`expenseId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoice_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_template_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`item_type` varchar(50) NOT NULL,
	`item_identifier` varchar(255) NOT NULL,
	`description` text,
	`amount` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `invoice_template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`project_id` int NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoice_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`user_id` int,
	`applicant_name` varchar(255),
	`applicant_email` varchar(320),
	`applicant_phone` varchar(50),
	`resume_url` varchar(500),
	`cover_letter` text,
	`status` enum('submitted','reviewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'submitted',
	`applied_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`reviewed_by` int,
	`notes` text,
	CONSTRAINT `job_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`user_id` int,
	`user_type` enum('team_member','public') NOT NULL,
	`click_type` enum('apply_button','external_link','email') NOT NULL,
	`ip_address` varchar(45),
	`clicked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_postings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`company` varchar(255),
	`location` varchar(255),
	`job_type` varchar(50),
	`salary` varchar(100),
	`application_url` varchar(500),
	`application_email` varchar(320),
	`external_source` varchar(100),
	`is_public` boolean NOT NULL DEFAULT true,
	`status` enum('active','closed','draft') NOT NULL DEFAULT 'active',
	`posted_by` int NOT NULL,
	`view_count` int NOT NULL DEFAULT 0,
	`click_count` int NOT NULL DEFAULT 0,
	`application_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expires_at` timestamp,
	CONSTRAINT `job_postings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`user_id` int,
	`user_type` enum('team_member','public') NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`viewed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_request_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meeting_request_id` int NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `meeting_request_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requested_by` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`requested_date` datetime NOT NULL,
	`duration_minutes` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`admin_notes` text,
	`session_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `meeting_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_bonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`category` varchar(50) NOT NULL,
	`rank` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`awarded_at` timestamp DEFAULT (now()),
	`paid_at` timestamp,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `monthly_bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_pack_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packId` int NOT NULL,
	`documentId` int NOT NULL,
	`orderIndex` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_pack_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`role` enum('admin','finance','team_member','student') NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`feature_slug` varchar(100) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`logo_url` varchar(500),
	`primary_color` varchar(7) DEFAULT '#0a7ea4',
	`subscription_tier` enum('trial','starter','professional','enterprise','custom') NOT NULL DEFAULT 'trial',
	`subscription_status` enum('trial','active','past_due','suspended','cancelled') NOT NULL DEFAULT 'trial',
	`trial_ends_at` timestamp,
	`billing_email` varchar(320) NOT NULL,
	`max_users` int NOT NULL DEFAULT 10,
	`contact_name` varchar(255),
	`contact_phone` varchar(50),
	`address` text,
	`onboarding_completed` boolean NOT NULL DEFAULT false,
	`onboarding_step` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `participant_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`interactionType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`notes` text,
	`recordedBy` int NOT NULL,
	`interactionDate` timestamp NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participant_session_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`session_id` int NOT NULL,
	`linked_at` timestamp DEFAULT (now()),
	CONSTRAINT `participant_session_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`date_of_birth` date,
	`gender` varchar(50),
	`ethnicity` varchar(100),
	`postcode` varchar(20),
	`referral_source` varchar(255),
	`school_id` int,
	`consent_given` boolean DEFAULT true,
	`registered_at` timestamp DEFAULT (now()),
	`last_active_at` timestamp,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pay_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hourlyRate` decimal(10,2),
	`sessionRate` decimal(10,2),
	`effectiveDate` timestamp NOT NULL,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pay_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payslips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payPeriodStart` timestamp NOT NULL,
	`payPeriodEnd` timestamp NOT NULL,
	`grossAmount` decimal(10,2) NOT NULL,
	`netAmount` decimal(10,2) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payslips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positive_id_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int,
	`school` varchar(255),
	`gender` varchar(50),
	`age` int,
	`felt_safe` varchar(20),
	`helped_feel_better` varchar(20),
	`comfortable_asking_help` varchar(20),
	`aware_of_support` varchar(20),
	`facilitators_good_job` varchar(20),
	`heritage_important` varchar(20),
	`heritage_reason` text,
	`would_recommend` varchar(20),
	`enjoyment_rating` int,
	`liked_most` text,
	`improvements` text,
	`submitted_at` timestamp DEFAULT (now()),
	CONSTRAINT `positive_id_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`sender_type` varchar(20) NOT NULL,
	`message_type` varchar(20) DEFAULT 'text',
	`content` text,
	`media_url` varchar(500),
	`read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `private_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`last_message_at` timestamp,
	CONSTRAINT `private_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `private_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `program_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programName` varchar(255) NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(50),
	`age` int,
	`interests` text,
	`additionalInfo` text,
	`status` varchar(50) NOT NULL DEFAULT 'new',
	`contactedAt` timestamp,
	`contactedBy` int,
	`notes` text,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `program_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(100) DEFAULT 'team_member',
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_chat_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` varchar(50) DEFAULT 'member',
	`joined_at` timestamp DEFAULT (now()),
	CONSTRAINT `project_chat_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`user_id` int NOT NULL,
	`message_type` varchar(20) DEFAULT 'text',
	`content` text,
	`media_url` varchar(500),
	`thumbnail_url` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `project_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_by` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `project_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rank_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`old_rank` varchar(50),
	`new_rank` varchar(50) NOT NULL,
	`changed_by` int NOT NULL,
	`reason` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `rank_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `school_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`facilitatorId` int NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`contactEmail` varchar(255),
	`overallRating` int NOT NULL,
	`deliveryQuality` int,
	`punctuality` int,
	`professionalism` int,
	`studentEngagement` int,
	`comments` text,
	`wouldRecommend` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`contentType` varchar(50) NOT NULL,
	`contentUrl` varchar(500) NOT NULL,
	`caption` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`publishedAt` timestamp,
	`views` int NOT NULL DEFAULT 0,
	`reach` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`workshopQuality` int,
	`facilitatorPerformance` int,
	`venueRating` int,
	`whatWentWell` text,
	`improvements` text,
	`engagementLevel` enum('low','medium','high'),
	`venueFeedback` text,
	`suggestions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`leadFacilitatorRate` decimal(10,2),
	`supportFacilitatorRate` decimal(10,2),
	`hourlyRate` decimal(10,2),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submission_id` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`post_id` varchar(255),
	`post_url` varchar(500),
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`views` int DEFAULT 0,
	`reach` int DEFAULT 0,
	`engagement` int DEFAULT 0,
	`posted_at` timestamp DEFAULT (now()),
	`last_synced_at` timestamp,
	CONSTRAINT `social_media_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_quality_rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`average_quality_rating` decimal(3,2) NOT NULL,
	`total_approved_posts` int DEFAULT 0,
	`rank` int,
	`bonus_awarded` boolean DEFAULT false,
	`bonus_amount` decimal(10,2),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_media_quality_rankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_reach_rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`total_reach` int DEFAULT 0,
	`total_likes` int DEFAULT 0,
	`total_shares` int DEFAULT 0,
	`total_engagement` int DEFAULT 0,
	`rank` int,
	`bonus_awarded` boolean DEFAULT false,
	`bonus_amount` decimal(10,2),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_media_reach_rankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`message_id` int NOT NULL,
	`submitted_by` int NOT NULL,
	`caption` text,
	`platforms` json DEFAULT ('["instagram"]'),
	`status` varchar(20) DEFAULT 'pending',
	`qualityRating` int,
	`reviewed_by` int,
	`reviewNotes` text,
	`submitted_at` timestamp DEFAULT (now()),
	`reviewed_at` timestamp,
	CONSTRAINT `social_media_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_chat_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL DEFAULT 1,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_by` int NOT NULL,
	`last_message_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_chat_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int NOT NULL,
	`user_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`actionDescription` text NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`metadata` json,
	`performedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`accessLevel` enum('read','write','admin') NOT NULL DEFAULT 'read',
	`grantedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`session_start` timestamp DEFAULT (now()),
	`session_end` timestamp,
	`duration` int,
	`platform` varchar(20),
	`device_info` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_call_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL,
	`leftAt` timestamp,
	`durationMinutes` int,
	`calculatedPayment` decimal(10,2),
	`invoiceStatus` enum('unpaid','invoiced','paid') NOT NULL DEFAULT 'unpaid',
	`invoiceId` int,
	`invoicedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_call_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `status` enum('draft','pending','approved','rejected','paid') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `status` enum('active','completed','archived','on_hold') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `training_progress` MODIFY COLUMN `id` serial AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `training_progress` MODIFY COLUMN `completed` boolean;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','admin','finance','safeguarding','team_member','student','social_media_manager') NOT NULL DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_lines` ADD `category` enum('management_fee','coordinator','delivery','evaluation_report','equipment_materials','venue_hire','contingency') NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_lines` ADD `startDate` timestamp;--> statement-breakpoint
ALTER TABLE `budget_lines` ADD `endDate` timestamp;--> statement-breakpoint
ALTER TABLE `invoices` ADD `totalAmount` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `paidAmount` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `budgetLineCategory` enum('coordinator','delivery','venue_hire','evaluation_report','contingency','management_fee');--> statement-breakpoint
ALTER TABLE `invoices` ADD `dueDate` timestamp;--> statement-breakpoint
ALTER TABLE `invoices` ADD `rejectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `invoices` ADD `rejectedBy` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `adminComments` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `invoice_code` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` ADD `auto_generated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `code` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `isVirtualMeeting` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `meetingLink` varchar(500);--> statement-breakpoint
ALTER TABLE `sessions` ADD `meetingType` enum('zoom','google_meet','teams','other');--> statement-breakpoint
ALTER TABLE `sessions` ADD `approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `requestedBy` int;--> statement-breakpoint
ALTER TABLE `sessions` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `sessions` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sessions` ADD `requiredDeliverables` json;--> statement-breakpoint
ALTER TABLE `sessions` ADD `attendeeCount` int;--> statement-breakpoint
ALTER TABLE `surveys` ADD `isAnonymous` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `training_modules` ADD `category` varchar(50) DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `training_modules` ADD `duration` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `training_modules` ADD `isRequired` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `training_progress` ADD `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `training_progress` ADD `module_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `training_progress` ADD `completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `training_progress` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `training_progress` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `profileImageUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `canPostJobs` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pushToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `notificationPreferences` json;--> statement-breakpoint
ALTER TABLE `users` ADD `magicLinkToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `magicLinkExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `budgetLineId`;--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `sessionId`;--> statement-breakpoint
ALTER TABLE `training_progress` DROP COLUMN `moduleId`;--> statement-breakpoint
ALTER TABLE `training_progress` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `training_progress` DROP COLUMN `completedAt`;--> statement-breakpoint
ALTER TABLE `training_progress` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `training_progress` DROP COLUMN `updatedAt`;