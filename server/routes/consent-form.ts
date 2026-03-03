import { Express, Request, Response } from "express";
import { getDb } from "../db";
import { projects, consentForms } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Setup consent form routes for public access (parents filling out forms)
 */
export function setupConsentFormRoutes(app: Express) {
  // GET /consent/:projectId - Display consent form for a specific project
  app.get("/consent/:projectId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);

      if (isNaN(projectId)) {
        return res.status(400).send("Invalid project ID");
      }

      // Fetch project details
      const db = await getDb();
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return res.status(404).send("Project not found");
      }

      // Render HTML consent form
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parental Consent Form - ${project.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      color: #1a202c;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .project-name {
      color: #667eea;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #4a5568;
      font-weight: 500;
      margin-bottom: 8px;
    }
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    input:focus,
    select:focus {
      outline: none;
      border-color: #667eea;
    }
    .checkbox-group {
      margin: 24px 0;
      padding: 20px;
      background: #f7fafc;
      border-radius: 8px;
    }
    .checkbox-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .checkbox-item:last-child {
      margin-bottom: 0;
    }
    input[type="checkbox"] {
      margin-right: 12px;
      margin-top: 4px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .checkbox-label {
      flex: 1;
      color: #2d3748;
      line-height: 1.6;
    }
    button {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
      transform: none;
    }
    .success-message {
      display: none;
      padding: 20px;
      background: #c6f6d5;
      border: 2px solid #48bb78;
      border-radius: 8px;
      color: #22543d;
      text-align: center;
      font-weight: 500;
    }
    .error-message {
      display: none;
      padding: 20px;
      background: #fed7d7;
      border: 2px solid #f56565;
      border-radius: 8px;
      color: #742a2a;
      text-align: center;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Parental Consent Form</h1>
    <div class="project-name">${project.name}</div>
    
    <form id="consentForm">
      <div class="form-group">
        <label for="parentName">Parent/Guardian Name *</label>
        <input type="text" id="parentName" name="parentName" required>
      </div>

      <div class="form-group">
        <label for="parentEmail">Email Address *</label>
        <input type="email" id="parentEmail" name="parentEmail" required>
      </div>

      <div class="form-group">
        <label for="parentPhone">Phone Number *</label>
        <input type="tel" id="parentPhone" name="parentPhone" required>
      </div>

      <div class="form-group">
        <label for="childName">Child's Name *</label>
        <input type="text" id="childName" name="childName" required>
      </div>

      <div class="form-group">
        <label for="childSchool">School *</label>
        <input type="text" id="childSchool" name="childSchool" required>
      </div>

      <div class="form-group">
        <label for="childYear">Year Group *</label>
        <select id="childYear" name="childYear" required>
          <option value="">Select year group</option>
          <option value="7">Year 7</option>
          <option value="8">Year 8</option>
          <option value="9">Year 9</option>
          <option value="10">Year 10</option>
          <option value="11">Year 11</option>
          <option value="12">Year 12</option>
          <option value="13">Year 13</option>
        </select>
      </div>

      <div class="checkbox-group">
        <div class="checkbox-item">
          <input type="checkbox" id="photoConsent" name="photoConsent">
          <label for="photoConsent" class="checkbox-label">
            I consent to my child being photographed during program activities
          </label>
        </div>

        <div class="checkbox-item">
          <input type="checkbox" id="videoConsent" name="videoConsent">
          <label for="videoConsent" class="checkbox-label">
            I consent to my child being recorded on video during program activities
          </label>
        </div>

        <div class="checkbox-item">
          <input type="checkbox" id="medicalConsent" name="medicalConsent" required>
          <label for="medicalConsent" class="checkbox-label">
            <strong>*</strong> I give permission for emergency medical treatment if required
          </label>
        </div>

        <div class="checkbox-item">
          <input type="checkbox" id="termsConsent" name="termsConsent" required>
          <label for="termsConsent" class="checkbox-label">
            <strong>*</strong> I agree to the terms and conditions of the program
          </label>
        </div>
      </div>

      <button type="submit" id="submitBtn">Submit Consent Form</button>
    </form>

    <div class="success-message" id="successMessage">
      ✓ Thank you! Your consent form has been submitted successfully.
    </div>

    <div class="error-message" id="errorMessage">
      ✗ An error occurred. Please try again.
    </div>
  </div>

  <script>
    document.getElementById('consentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submitBtn');
      const form = document.getElementById('consentForm');
      const successMsg = document.getElementById('successMessage');
      const errorMsg = document.getElementById('errorMessage');
      
      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      // Hide previous messages
      successMsg.style.display = 'none';
      errorMsg.style.display = 'none';
      
      try {
        const formData = new FormData(e.target);
        const data = {
          projectId: ${projectId},
          parentName: formData.get('parentName'),
          parentEmail: formData.get('parentEmail'),
          parentPhone: formData.get('parentPhone'),
          childName: formData.get('childName'),
          childSchool: formData.get('childSchool'),
          childYear: parseInt(formData.get('childYear')),
          photoConsent: formData.get('photoConsent') === 'on',
          videoConsent: formData.get('videoConsent') === 'on',
          medicalConsent: formData.get('medicalConsent') === 'on',
          termsConsent: formData.get('termsConsent') === 'on',
        };
        
        const response = await fetch('/api/consent/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          form.style.display = 'none';
          successMsg.style.display = 'block';
        } else {
          throw new Error('Submission failed');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Consent Form';
      }
    });
  </script>
</body>
</html>
      `;

      res.send(html);
    } catch (error) {
      console.error("Error loading consent form:", error);
      res.status(500).send("Error loading consent form");
    }
  });

  // POST /api/consent/submit - Submit consent form
  // COMMENTED OUT: Schema mismatch - this route uses simplified fields (parentName, childName)
  // but the schema expects detailed fields (parentGuardianFullName, childFullName, etc.)
  // Use TRPC router instead: server/routers/consent.ts
  /*
  app.post("/api/consent/submit", async (req: Request, res: Response) => {
    try {
      const {
        projectId,
        parentName,
        parentEmail,
        parentPhone,
        childName,
        childSchool,
        childYear,
        photoConsent,
        videoConsent,
        medicalConsent,
        termsConsent,
      } = req.body;

      // Validate required fields
      if (
        !projectId ||
        !parentName ||
        !parentEmail ||
        !childName ||
        !childSchool ||
        !childYear ||
        !medicalConsent ||
        !termsConsent
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Insert consent form
      const db = await getDb();
      await db.insert(consentForms).values({
        projectId,
        parentName,
        parentEmail,
        parentPhone,
        childName,
        childSchool,
        childYear,
        photoConsent,
        videoConsent,
        medicalConsent,
        termsConsent,
        submittedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting consent form:", error);
      res.status(500).json({ error: "Failed to submit consent form" });
    }
  });
  */
}
