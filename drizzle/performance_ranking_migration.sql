-- Add quality rating fields to session_feedback table
ALTER TABLE session_feedback ADD COLUMN workshopQuality INT COMMENT '1-5 rating for workshop feedback quality';
ALTER TABLE session_feedback ADD COLUMN facilitatorPerformance INT COMMENT '1-5 rating for facilitator performance';
ALTER TABLE session_feedback ADD COLUMN venueRating INT COMMENT '1-5 rating for venue quality';

-- Add quality rating to social_media_submissions table
ALTER TABLE social_media_submissions ADD COLUMN qualityRating INT COMMENT '1-5 rating for post quality (set when reviewed)';

-- Create school_feedback table
CREATE TABLE IF NOT EXISTS school_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId INT NOT NULL,
  facilitatorId INT NOT NULL,
  schoolName VARCHAR(255) NOT NULL,
  contactName VARCHAR(255),
  contactEmail VARCHAR(255),
  overallRating INT NOT NULL COMMENT '1-5 rating',
  deliveryQuality INT COMMENT '1-5 rating',
  punctuality INT COMMENT '1-5 rating',
  professionalism INT COMMENT '1-5 rating',
  studentEngagement INT COMMENT '1-5 rating',
  comments TEXT,
  wouldRecommend BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
