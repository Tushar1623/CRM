# Product Requirements Document (PRD)
## Second-Hand Car Sales CRM – Basic Version

**Product Name:** Used Car CRM  
**Version:** MVP / Version 1.0  
**Product Type:** Web-Based CRM  
**Primary Users:** Used car dealership owners, sales managers, and sales executives

---

# 1. Product Overview

The Used Car CRM is a simple customer relationship management system designed for a second-hand car selling company.

The system will help the dealership manage:

- Customer enquiries
- Sales leads
- Follow-ups
- Used car inventory
- Test drives
- Sales pipeline
- Customer details
- Deal status
- Sales team activity
- Basic reports

The main purpose of the CRM is to ensure that no customer enquiry or follow-up is missed and that the complete journey from enquiry to vehicle sale can be tracked from one system.

---

# 2. Problem Statement

Used car dealerships often manage customer enquiries through:

- Excel sheets
- WhatsApp
- Phone calls
- Notebooks
- Individual salesperson records

This creates problems such as:

- Leads getting lost
- Follow-ups being missed
- Multiple salespeople contacting the same customer
- Difficulty knowing which cars customers are interested in
- No clear sales pipeline
- Poor visibility into salesperson performance
- Difficulty tracking available and sold inventory
- No centralized customer database

The CRM should solve these problems using a simple centralized dashboard.

---

# 3. Product Goals

The MVP should allow the company to:

1. Store every customer enquiry.
2. Assign leads to sales executives.
3. Track customer follow-ups.
4. Track customer interest in specific cars.
5. Maintain available used-car inventory.
6. Schedule test drives.
7. Move leads through different sales stages.
8. Mark successful and unsuccessful deals.
9. View basic salesperson performance.
10. View basic business reports.

---

# 4. User Roles

## 4.1 Admin / Owner

Admin should have complete access to the CRM.

Admin can:

- View all leads
- Add leads
- Edit leads
- Delete leads
- Assign leads
- Add employees
- Add/edit vehicles
- View all follow-ups
- View sales reports
- View dashboard
- View completed deals
- Manage CRM settings

---

## 4.2 Sales Manager

Sales Manager can:

- View all leads
- Assign leads
- Monitor sales executives
- View follow-ups
- View vehicle inventory
- Update lead stages
- View sales reports

Manager may not have access to major system settings.

---

## 4.3 Sales Executive

Sales Executive can:

- View assigned leads
- Add customer notes
- Call/contact customers
- Schedule follow-ups
- Schedule test drives
- Update lead status
- Update customer interest
- Mark deals as won/lost

Sales executives should primarily see their own leads.

---

# 5. Main CRM Modules

The basic CRM will contain the following modules:

1. Dashboard
2. Lead Management
3. Customer Management
4. Car Inventory
5. Follow-Up Management
6. Test Drive Management
7. Sales Pipeline
8. Deal Management
9. Employee Management
10. Reports
11. Settings

---

# 6. Dashboard

The dashboard will provide a quick overview of dealership activity.

## Dashboard Cards

Display:

- Total Leads
- New Leads Today
- Follow-ups Today
- Overdue Follow-ups
- Test Drives Today
- Cars Available
- Cars Sold
- Deals Won
- Deals Lost
- Monthly Sales

Example:

**Total Leads:** 1,250  
**New Today:** 32  
**Follow-ups Today:** 18  
**Test Drives:** 7  
**Cars Available:** 65  
**Cars Sold This Month:** 21

---

# 7. Lead Management

This is the main module of the CRM.

## Lead Information

Each lead should contain:

### Customer Information

- Customer Name
- Mobile Number
- Alternate Mobile Number
- Email
- City
- Area / Location
- Address

### Lead Information

- Lead ID
- Lead Source
- Assigned Salesperson
- Lead Created Date
- Lead Status
- Priority

Priority options:

- Hot
- Warm
- Cold

---

# 8. Lead Sources

The system should allow the dealership to identify where leads are coming from.

Lead Source options:

- Walk-in
- Website
- Facebook
- Instagram
- WhatsApp
- Google Ads
- Facebook Ads
- CarDekho
- Cars24
- OLX
- Referral
- Phone Call
- Existing Customer
- Other

Admin should eventually be able to add custom lead sources.

---

# 9. Lead Status / Sales Pipeline

Each customer should move through a simple sales pipeline.

Recommended stages:

### 1. New Lead

Customer enquiry has just been received.

### 2. Contacted

Sales executive has contacted the customer.

### 3. Interested

Customer has shown interest in one or more cars.

### 4. Follow-Up

Customer needs to be contacted again.

### 5. Test Drive Scheduled

Customer has booked a test drive.

### 6. Test Drive Completed

Customer has completed the test drive.

### 7. Negotiation

Price or financing discussion is ongoing.

### 8. Booking

Customer has paid booking amount.

### 9. Sold / Won

Vehicle has been successfully sold.

### 10. Lost

Customer did not purchase.

---

# 10. Lead List Page

The Lead List screen should show:

| Lead | Phone | Interested Car | Source | Salesperson | Status | Priority | Next Follow-up |
|---|---|---|---|---|---|---|---|
| Rahul Das | 98XXXXXXXX | Creta 2021 | Facebook | Amit | Follow-Up | Hot | 5 Sep |
| Rohan Roy | 90XXXXXXXX | Swift 2020 | Walk-in | Raj | Test Drive | Warm | 6 Sep |

Users should be able to:

- Search leads
- Filter leads
- Sort leads
- Open lead details
- Add new lead

---

# 11. Lead Filters

Allow filtering by:

- Lead status
- Sales executive
- Lead source
- Priority
- Date
- Interested vehicle
- City
- Follow-up date

Example:

**Show all Hot Leads assigned to Amit with follow-ups today.**

---

# 12. Lead Details Page

Opening a lead should show the complete customer journey.

## Header

Customer Name  
Phone Number  
Lead Status  
Priority  
Assigned Salesperson

Buttons:

- Call
- WhatsApp
- Add Follow-Up
- Schedule Test Drive
- Change Status

---

## Customer Information

Display:

- Name
- Phone
- Email
- Address
- City
- Source

---

## Interested Cars

A customer may be interested in multiple vehicles.

Example:

**Hyundai Creta 2021**

₹8,50,000

**Maruti Brezza 2022**

₹9,10,000

---

# 13. Customer Requirement

Sales executive should be able to record customer requirements.

Fields:

- Preferred Brand
- Preferred Model
- Minimum Budget
- Maximum Budget
- Fuel Type
- Transmission
- Preferred Year
- Preferred Colour
- Body Type

Example:

Budget: ₹6L – ₹8L  
Brand: Hyundai / Kia  
Fuel: Petrol  
Transmission: Automatic  
Body Type: SUV

This can later be used for car recommendations.

---

# 14. Follow-Up Management

Follow-up management is one of the most important CRM features.

Sales executive should be able to create a follow-up.

Fields:

- Follow-Up Date
- Follow-Up Time
- Follow-Up Type
- Notes
- Reminder

Follow-Up Type:

- Call
- WhatsApp
- Meeting
- Showroom Visit
- Test Drive
- Other

---

# 15. Follow-Up Status

Each follow-up should have:

- Pending
- Completed
- Missed
- Rescheduled

The dashboard should clearly highlight overdue follow-ups.

Example:

### Follow-ups Today

Rahul Das – 11:00 AM  
Rohan Roy – 2:30 PM  
Amit Sharma – 5:00 PM

---

# 16. Follow-Up Notes

After contacting a customer, salesperson can enter a note.

Example:

> Customer liked the Creta but wants to discuss the price with family. Call again on Saturday.

The CRM should keep a timeline of all notes.

---

# 17. Customer Activity Timeline

Every lead should maintain an activity history.

Example:

**4 Sep – 10:30 AM**  
Lead created from Facebook.

**4 Sep – 11:00 AM**  
Assigned to Amit.

**4 Sep – 12:15 PM**  
Customer contacted.

**4 Sep – 12:20 PM**  
Customer interested in Hyundai Creta.

**5 Sep – 4:00 PM**  
Test drive scheduled.

This provides complete visibility into customer communication.

---

# 18. Car Inventory Module

The system should maintain a database of available used cars.

## Car Information

Fields:

- Car ID / Stock ID
- Registration Number
- Brand
- Model
- Variant
- Manufacturing Year
- Registration Year
- Fuel Type
- Transmission
- Kilometres Driven
- Number of Owners
- Colour
- Registration City
- Insurance Validity
- Asking Price
- Purchase Price
- Minimum Selling Price
- Vehicle Status
- Location
- Notes

---

# 19. Vehicle Status

Vehicle status options:

- Available
- Reserved
- Test Drive
- Booked
- Sold
- Under Inspection
- Under Repair

---

# 20. Car Photos

Each car should support multiple images.

Suggested categories:

- Front
- Rear
- Left
- Right
- Interior
- Dashboard
- Engine
- Additional Images

The primary image should appear as the vehicle thumbnail.

---

# 21. Inventory Page

Example:

| Car | Year | KM | Fuel | Price | Status |
|---|---:|---:|---|---:|---|
| Hyundai Creta SX | 2021 | 38,000 | Petrol | ₹8.5L | Available |
| Maruti Swift VXI | 2020 | 44,000 | Petrol | ₹5.2L | Available |
| Honda City VX | 2019 | 62,000 | Petrol | ₹7.1L | Booked |

Filters:

- Brand
- Model
- Year
- Price
- Fuel
- Transmission
- Status

---

# 22. Test Drive Management

Sales executives should be able to schedule test drives.

Fields:

- Customer
- Vehicle
- Date
- Time
- Sales Executive
- Location
- Notes

Test Drive Status:

- Scheduled
- Completed
- Cancelled
- No Show
- Rescheduled

---

# 23. Test Drive Calendar

Provide a simple calendar/list showing:

### Today's Test Drives

10:00 AM – Rahul – Creta  
12:30 PM – Suman – Swift  
4:00 PM – Arjun – City

This helps prevent scheduling conflicts.

---

# 24. Deal Management

When the customer is ready to purchase a vehicle, a deal should be created.

Fields:

- Customer
- Vehicle
- Salesperson
- Asking Price
- Negotiated Price
- Final Selling Price
- Booking Amount
- Payment Status
- Deal Date
- Expected Delivery Date
- Deal Status

---

# 25. Deal Status

Statuses:

- Negotiation
- Booking Pending
- Booked
- Payment Pending
- Payment Completed
- Delivered
- Cancelled

---

# 26. Lost Lead Reason

When a lead is marked Lost, salesperson should select a reason.

Options:

- Price too high
- Bought from competitor
- Car unavailable
- Loan rejected
- Customer not interested
- Customer not responding
- Requirement changed
- Purchase postponed
- Other

This data can later help management understand why sales are being lost.

---

# 27. Employee Management

Admin should be able to create sales team accounts.

Employee fields:

- Employee Name
- Mobile
- Email
- Role
- Username
- Password
- Status

Status:

- Active
- Inactive

---

# 28. Lead Assignment

Admin/Manager should be able to assign leads to sales executives.

Example:

Lead: Rahul Das

Assigned To: Amit Sharma

Later versions can support automatic lead distribution.

For MVP, manual assignment is sufficient.

---

# 29. Basic Reports

The first version should contain simple reports.

### Sales Report

Show:

- Total sales
- Cars sold
- Revenue
- Salesperson
- Date range

### Lead Report

Show:

- Total Leads
- New Leads
- Converted Leads
- Lost Leads
- Conversion Rate

### Lead Source Report

Example:

Facebook – 300 Leads  
Instagram – 180 Leads  
Walk-in – 120 Leads  
Website – 90 Leads

---

# 30. Salesperson Performance

Example:

| Salesperson | Leads | Follow-ups | Test Drives | Sales |
|---|---:|---:|---:|---:|
| Amit | 150 | 120 | 35 | 12 |
| Raj | 135 | 105 | 29 | 10 |
| Rahul | 90 | 76 | 18 | 7 |

This allows management to monitor salesperson performance.

---

# 31. Search

A global search should allow users to search by:

- Customer name
- Phone number
- Vehicle model
- Registration number
- Lead ID
- Car Stock ID

---

# 32. Notifications

Basic CRM notifications should include:

- Follow-up due
- Follow-up overdue
- Test drive scheduled
- Test drive reminder
- New lead assigned
- Vehicle booked
- Vehicle sold

For Version 1, in-app notifications are sufficient.

WhatsApp/SMS notifications can be added later.

---

# 33. Customer Duplicate Detection

When adding a lead, the CRM should check the phone number.

If the phone number already exists:

Display:

**Customer already exists.**

Show the existing customer record instead of creating another duplicate customer.

---

# 34. Navigation Structure

Recommended left sidebar:

**Dashboard**

**CRM**
- Leads
- Customers
- Follow-ups
- Test Drives

**Inventory**
- All Cars
- Add Car

**Sales**
- Pipeline
- Deals

**Reports**
- Sales Report
- Lead Report
- Employee Performance

**Management**
- Employees
- Settings

---

# 35. Dashboard UI Structure

Recommended layout:

### Top Bar

Search  
Notifications  
User Profile

### Sidebar

Navigation Menu

### Main Area

Top KPI cards

Then:

Lead Pipeline

Follow-ups Today

Recent Leads

Upcoming Test Drives

Recent Sales

---

# 36. Sales Pipeline UI

Use a Kanban-style board.

Example:

### NEW

Rahul  
Creta  
₹8L Budget

### CONTACTED

Suman  
Swift  
₹5L Budget

### FOLLOW-UP

Arjun  
City  
₹7L Budget

### TEST DRIVE

Rohit  
Brezza  
₹9L Budget

### NEGOTIATION

Amit  
Creta  
₹8.2L Offer

### WON

Raj  
Nexon  
₹8.7L

Users should ideally be able to drag leads between stages.

---

# 37. Core Database Entities

The MVP should have the following main tables:

### Users

- id
- name
- phone
- email
- role
- password
- status

### Customers

- id
- name
- phone
- alternate_phone
- email
- address
- city

### Leads

- id
- customer_id
- source
- assigned_to
- priority
- status
- created_at

### Vehicles

- id
- stock_id
- registration_number
- brand
- model
- variant
- year
- fuel
- transmission
- km_driven
- owners
- purchase_price
- selling_price
- status

### Lead Vehicle Interests

- id
- lead_id
- vehicle_id

### Follow-Ups

- id
- lead_id
- employee_id
- follow_up_date
- follow_up_time
- type
- note
- status

### Test Drives

- id
- customer_id
- vehicle_id
- employee_id
- date
- time
- status

### Deals

- id
- customer_id
- vehicle_id
- salesperson_id
- selling_price
- booking_amount
- payment_status
- deal_status
- deal_date

### Activities

- id
- lead_id
- user_id
- action
- note
- timestamp

---

# 38. Primary User Flow

## Lead-to-Sale Workflow

**Lead Received**

↓

Create Customer

↓

Create Lead

↓

Assign Sales Executive

↓

Contact Customer

↓

Record Customer Requirement

↓

Select Interested Vehicle

↓

Schedule Follow-Up

↓

Schedule Test Drive

↓

Negotiation

↓

Booking

↓

Payment

↓

Vehicle Sold

↓

Deal Closed

---

# 39. MVP Features

The first release should focus only on essential functionality.

### Must Have

- Login
- User roles
- Dashboard
- Lead creation
- Lead management
- Lead assignment
- Customer management
- Lead pipeline
- Follow-up management
- Inventory management
- Vehicle details
- Test drive scheduling
- Deal management
- Activity timeline
- Basic reports
- Search
- Filters

---

# 40. Features Not Required in MVP

These features should be kept for later versions:

- WhatsApp API integration
- Facebook Lead Ads integration
- Instagram integration
- Automatic lead assignment
- AI lead scoring
- AI sales assistant
- Call recording
- Automatic calling
- SMS integration
- Loan management
- Insurance management
- RTO transfer management
- Accounting
- GST invoicing
- Advanced analytics
- Customer mobile application
- Dealer mobile application
- Multiple branches
- Advanced permissions
- Marketing automation

Keeping these outside Version 1 will make the CRM significantly faster and cheaper to develop.

---

# 41. Suggested Technology Stack

For a basic modern CRM:

### Frontend

React / Next.js

### Backend

Node.js / Next.js API

### Database

PostgreSQL

### UI

Tailwind CSS

### Authentication

Supabase Auth or similar authentication system

### Database & Storage

Supabase can be used for:

- PostgreSQL database
- Authentication
- Car image storage

This stack is suitable for a relatively low-cost MVP.

---

# 42. Responsive Design

The CRM should work primarily on desktop but also be usable from:

- Laptop
- Tablet
- Mobile browser

Sales executives will frequently access customer information from their phones, so lead details, calling and follow-up screens should be mobile-friendly.

---

# 43. Phone & WhatsApp Actions

Beside customer phone number provide:

**Call**

Clicking should open:

`tel:customer-number`

**WhatsApp**

Clicking should open the WhatsApp conversation with that customer.

Full WhatsApp API automation is not required for MVP.

---

# 44. Security Requirements

The application should:

- Require authentication
- Use role-based permissions
- Protect customer data
- Hash passwords
- Maintain secure user sessions
- Prevent unauthorized users from viewing other data
- Keep activity logs for important changes

---

# 45. Performance Requirements

The system should:

- Load dashboard within approximately 2–3 seconds under normal usage
- Support at least 10,000+ leads initially
- Support hundreds/thousands of vehicle records
- Provide fast search and filtering
- Work properly on modern browsers

---

# 46. Basic Acceptance Criteria

The MVP will be considered successful when:

1. Admin can create employees.
2. Employees can log in.
3. New leads can be created.
4. Leads can be assigned to sales executives.
5. Sales executives can update lead stages.
6. Follow-ups can be scheduled.
7. Overdue follow-ups are visible.
8. Cars can be added to inventory.
9. Cars can be linked to interested customers.
10. Test drives can be scheduled.
11. Lead activity history is recorded.
12. Deals can be marked Won or Lost.
13. Sold cars change their inventory status.
14. Admin can see basic sales reports.
15. Users can search customers using mobile numbers.

---

# 47. Recommended MVP Pages

The complete MVP can initially be built with approximately these screens:

1. Login
2. Dashboard
3. Lead List
4. Add Lead
5. Lead Details
6. Customer List
7. Inventory
8. Add Vehicle
9. Vehicle Details
10. Follow-Ups
11. Test Drives
12. Sales Pipeline
13. Deals
14. Employees
15. Reports
16. Settings

---

# 48. Future Version – Phase 2

After the basic CRM works properly, Version 2 can introduce:

### Lead Automation

Facebook Lead Ads → CRM

Instagram Leads → CRM

Website Leads → CRM

WhatsApp Leads → CRM

### Communication

WhatsApp templates

Automatic follow-up messages

SMS reminders

Email communication

### Smart Features

Lead scoring

Hot lead detection

Car recommendation engine

AI follow-up suggestions

AI conversation summaries

### Dealer Operations

Finance / Loan Tracking

Insurance

RC Transfer

Vehicle Inspection

Purchase Management

Expense Tracking

Profit per Car

Multi-branch Management

---

# 49. Key Success Metrics

The dealership should eventually track:

- Number of leads
- Contact rate
- Follow-up completion rate
- Test-drive rate
- Lead-to-test-drive conversion
- Test-drive-to-sale conversion
- Overall lead conversion
- Average days to close
- Average selling price
- Profit per vehicle
- Sales per salesperson
- Lead source performance

---

# 50. Final MVP Scope

The basic CRM should essentially accomplish five things extremely well:

**1. Capture every enquiry**

**2. Make sure every customer receives proper follow-up**

**3. Show which cars are available**

**4. Track each customer from enquiry → test drive → negotiation → sale**

**5. Give the owner a clear picture of leads, employees, inventory and sales**

The first version should remain simple, fast and easy for dealership employees to use rather than trying to include every possible dealership-management feature.