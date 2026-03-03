# Change In Youth CIC - Mobile App Design

## Design Philosophy
This mobile app is designed for **Change In Youth CIC**, a youth organization that delivers workshops and programs in schools. The app serves as a complete digital office, enabling team management, financial tracking, and compliance documentation. The design follows **Apple Human Interface Guidelines** for a native iOS feel, optimized for **mobile portrait orientation (9:16)** and **one-handed usage**.

## Color Scheme
- **Primary**: Deep Blue (#0a7ea4) - represents trust, professionalism, and youth empowerment
- **Success**: Green (#22C55E) - for completed tasks, approved payments, positive metrics
- **Warning**: Amber (#F59E0B) - for pending approvals, missing documentation
- **Error**: Red (#EF4444) - for overdue tasks, budget alerts, compliance issues
- **Background**: White (light) / Dark Gray (dark mode)
- **Surface**: Light Gray cards for content grouping

## Screen List

### 1. Home Dashboard
**Primary Content:**
- Quick stats cards: upcoming sessions, pending invoices, budget status
- Today's schedule with facilitator assignments
- Recent activity feed (payments approved, tasks completed, new messages)
- Quick action buttons: Clock In, Submit Invoice, New Task

**Functionality:**
- Real-time budget overview with visual indicators
- Tap cards to navigate to detailed views
- Pull-to-refresh for latest data

### 2. Schedule/Rotas
**Primary Content:**
- Calendar view (week/month toggle)
- Session cards showing: project name, facilitators, venue, time
- Availability indicators for team members
- Conflict warnings highlighted in amber

**Functionality:**
- Tap session to view details
- Add/edit sessions with facilitator assignment
- Check team availability before scheduling
- Geolocation-based clock-in button when at venue
- Team pairing analytics (best performing pairs)

### 3. Tasks
**Primary Content:**
- Task list grouped by project
- Task cards showing: title, assignee, due date, priority, completion checklist
- Filter by: assigned to me, project, status, priority

**Functionality:**
- Create tasks linked to projects and sessions
- Assign to team members
- Mark completion criteria (register, evaluations, attendance)
- Automated payment eligibility check

### 4. Financial Management
**Primary Content:**
- Budget dashboard: total budget, spent, remaining per project
- Budget line breakdown with visual progress bars
- Invoice list: pending, approved, paid
- Expected payments list with reminders

**Functionality:**
- Upload invoice (photo/PDF) with auto-categorization via AI
- Match invoice to: person, project, budget line, amount
- Finance approval workflow
- Automatic budget deduction upon approval
- Payment tracking and notifications
- Expected payment reminders to facilitators

### 5. Chat & Communications
**Primary Content:**
- Team chat channels (general, project-specific)
- Safe student forum (moderated)
- Direct messages
- Announcement feed

**Functionality:**
- Real-time messaging
- File sharing (documents, images)
- @mentions and notifications
- Moderation tools for student forum

### 6. Compliance & Documentation
**Primary Content:**
- Document library: consent forms, evaluation forms, registers
- Session documentation checklist
- Form templates

**Functionality:**
- Upload and store documents by project/session
- Digital signature collection
- Automated reminders for missing documentation
- Search and filter documents

### 7. Surveys & Feedback
**Primary Content:**
- Survey builder with multiple question types
- Active surveys list
- Completed surveys with response count
- Data export options

**Functionality:**
- Create surveys for students/team
- Distribute via app or link
- Real-time response tracking
- Download data as CSV/Excel

### 8. Training & Resources
**Primary Content:**
- Training modules list
- Resource library
- Completion tracking

**Functionality:**
- Access training materials
- Mark modules as complete
- Track team training progress

### 9. Profile & Settings
**Primary Content:**
- User profile with role and contact info
- Notification preferences
- App settings (theme, language)
- Logout

**Functionality:**
- Edit profile information
- Manage notification settings
- View app version and support info

## Key User Flows

### Flow 1: Workshop Delivery & Payment
1. Facilitator views schedule → sees assigned workshop
2. Arrives at venue → taps "Clock In" (geolocation verified)
3. During session → completes digital register
4. After session → completes student evaluation forms
5. System checks criteria → all met (on time, register, evaluations)
6. Facilitator uploads invoice → AI categorizes (person, project, budget line, £70)
7. Finance receives notification → reviews invoice → approves
8. Budget line automatically deducted → payment notification sent
9. Finance processes payment → marks as paid in system

### Flow 2: Scheduling with Conflict Detection
1. Manager opens Schedule → taps "Add Session"
2. Selects project (e.g., Positive ID Workshop)
3. Chooses date/time and venue
4. Selects facilitators → system shows availability
5. Conflict warning appears if facilitator already scheduled
6. System suggests available team members
7. Manager views team pairing analytics → selects best pairing
8. Session created → notifications sent to facilitators

### Flow 3: Budget Monitoring
1. Finance opens Financial Dashboard → sees real-time budget overview
2. Taps project → views budget lines with spent/remaining
3. Sees pending invoices → taps to review
4. Approves invoice → budget line updates instantly
5. Alert appears if budget line approaching limit
6. Exports financial report for bookkeeper

## Layout & Navigation

### Tab Bar (Bottom Navigation)
- **Home**: Dashboard overview
- **Schedule**: Calendar and rotas
- **Tasks**: Task management
- **Finance**: Budget and invoices
- **More**: Chat, Compliance, Surveys, Training, Profile

### Design Patterns
- **Cards**: Primary content container with subtle shadows
- **List Items**: Swipeable for quick actions (approve, delete, archive)
- **Floating Action Button**: Primary action on each screen (+ Add)
- **Bottom Sheets**: For forms and detailed views
- **Pull-to-Refresh**: All list views
- **Empty States**: Friendly illustrations with clear CTAs

### Typography
- **Headers**: Bold, 24-28pt
- **Body**: Regular, 16pt, line-height 1.5
- **Captions**: 14pt for metadata

### Spacing
- **Screen Padding**: 16px
- **Card Padding**: 16px
- **Element Spacing**: 12px between elements, 24px between sections

## Accessibility
- High contrast text for readability
- Touch targets minimum 44x44pt
- VoiceOver support for all interactive elements
- Dynamic type support

## Offline Capability
- Core features work offline (view schedule, tasks, documents)
- Queue actions (clock-in, invoice upload) for sync when online
- Clear indicators for offline status

## Security & Privacy
- Secure authentication (Manus OAuth)
- Role-based access control (Admin, Finance, Facilitator, Student)
- Encrypted document storage
- Audit trail for financial transactions
