# Form & Button Audit Checklist

## Forms to Test

### Core Features
- [ ] Request Session Form (`/create-session`) - **PARTIALLY WORKING** (project selection works, submit button not responding)
- [ ] Create Video Meeting (`/create-video-meeting`)
- [ ] Import Historical Data (visible in screenshot)

### Financial
- [ ] Submit Invoice
- [ ] Submit Expense
- [ ] Approve Invoice (admin)
- [ ] Approve Expense (admin)

### Admin
- [ ] Create Onboarding Pack
- [ ] Add Pay Rate
- [ ] Upload Payslip
- [ ] Assign Project
- [ ] Create Organization (super admin)

### Communication
- [ ] Send Message (Team Chat)
- [ ] Send Message (Project Chat)
- [ ] Create Meeting Request

### Evaluations & Surveys
- [ ] Submit Positive ID Evaluation
- [ ] Submit Survey Response

### User Management
- [ ] Update Profile Settings
- [ ] Add Permission
- [ ] Register New User

### Development
- [ ] Add Development Goal

## Button Types Found

### Navigation Buttons (likely working)
- Back buttons (`← Back`, `← Cancel`)
- Close buttons (`×`, `✕`)
- View All buttons

### Action Buttons (need testing)
- Submit buttons
- Create buttons
- Save buttons
- Send buttons
- Approve/Reject buttons

## Testing Strategy

1. Test each form with Quick Admin Login
2. Check if button is clickable
3. Verify form submission works
4. Check success/error messages
5. Confirm data saves to database

## Fixes Needed

- Replace TouchableOpacity/Pressable with hybrid button approach for all submit buttons
- Ensure all buttons use `style` prop instead of `className`
