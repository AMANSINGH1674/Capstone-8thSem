-- ============================================================
-- AcademiX · Demo Seed Data
-- Run in: Supabase Dashboard → SQL Editor → Run
--
-- Creates 10 students + 1 teacher + 1 admin with realistic records.
-- All demo accounts use password: AcademiX@2024
-- Safe to re-run: wrapped in a DO block that checks for existence.
-- ============================================================

DO $$
DECLARE
  -- ── User IDs (fixed so re-runs are idempotent) ─────────────
  u_priya      UUID := 'a1000001-0000-0000-0000-000000000001';
  u_rahul      UUID := 'a1000002-0000-0000-0000-000000000002';
  u_sneha      UUID := 'a1000003-0000-0000-0000-000000000003';
  u_arjun      UUID := 'a1000004-0000-0000-0000-000000000004';
  u_divya      UUID := 'a1000005-0000-0000-0000-000000000005';
  u_karthik    UUID := 'a1000006-0000-0000-0000-000000000006';
  u_ananya     UUID := 'a1000007-0000-0000-0000-000000000007';
  u_vikram     UUID := 'a1000008-0000-0000-0000-000000000008';
  u_meera      UUID := 'a1000009-0000-0000-0000-000000000009';
  u_rohan      UUID := 'a1000010-0000-0000-0000-000000000010';
  u_teacher    UUID := 'b2000001-0000-0000-0000-000000000001';
  u_admin      UUID := 'c3000001-0000-0000-0000-000000000001';

  demo_pass    TEXT := crypt('AcademiX@2024', gen_salt('bf', 10));
BEGIN

  -- ── 1. Insert auth.users ────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    v.id, 'authenticated', 'authenticated', v.email,
    demo_pass, now() - (random() * INTERVAL '180 days'),
    '{"provider":"email","providers":["email"]}', '{}',
    now() - (random() * INTERVAL '180 days'), now(),
    '', '', '', ''
  FROM (VALUES
    (u_priya,    'priya.sharma@demo.academix.in'),
    (u_rahul,    'rahul.nair@demo.academix.in'),
    (u_sneha,    'sneha.patel@demo.academix.in'),
    (u_arjun,    'arjun.kumar@demo.academix.in'),
    (u_divya,    'divya.reddy@demo.academix.in'),
    (u_karthik,  'karthik.menon@demo.academix.in'),
    (u_ananya,   'ananya.singh@demo.academix.in'),
    (u_vikram,   'vikram.iyer@demo.academix.in'),
    (u_meera,    'meera.joshi@demo.academix.in'),
    (u_rohan,    'rohan.das@demo.academix.in'),
    (u_teacher,  'dr.kavitha@demo.academix.in'),
    (u_admin,    'admin@demo.academix.in')
  ) AS v(id, email)
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v.id);


  -- ── 2. Profiles ─────────────────────────────────────────────
  INSERT INTO public.profiles
    (id, full_name, department, year_of_study, roll_number, bio, role, is_portfolio_public)
  VALUES
    (u_priya,    'Priya Sharma',   'Computer Science',           3, 'CS21001', 'Passionate about AI and open-source development.', 'student', true),
    (u_rahul,    'Rahul Nair',     'Electronics & Communication',2, 'EC22015', 'Embedded systems enthusiast. IEEE student member.',  'student', false),
    (u_sneha,    'Sneha Patel',    'Computer Science',           4, 'CS20033', 'Full-stack developer. Google Developer Student Club lead.', 'student', true),
    (u_arjun,    'Arjun Kumar',    'Mechanical Engineering',     2, 'ME22007', 'Robotics and automation hobbyist.',                  'student', false),
    (u_divya,    'Divya Reddy',    'Business Administration',    3, 'MBA21042','Aspiring entrepreneur. TEDx speaker.',               'student', true),
    (u_karthik,  'Karthik Menon',  'Computer Science',           1, 'CS23018', 'First year student exploring ML and cybersecurity.',  'student', false),
    (u_ananya,   'Ananya Singh',   'Civil Engineering',          4, 'CE20005', 'Sustainable infrastructure advocate. NSS volunteer.', 'student', true),
    (u_vikram,   'Vikram Iyer',    'Electronics & Communication',3, 'EC21029', 'VLSI design and signal processing research.',         'student', false),
    (u_meera,    'Meera Joshi',    'Business Administration',    2, 'MBA22011','Marketing analytics and data-driven decision-making.','student', false),
    (u_rohan,    'Rohan Das',      'Mechanical Engineering',     3, 'ME21055', 'CAD/CAM expert. Inter-IIT participant.',              'student', false),
    (u_teacher,  'Dr. Kavitha R',  'Computer Science',           NULL, NULL, 'Associate Professor, Dept. of Computer Science.',     'teacher', false),
    (u_admin,    'System Admin',   NULL,                         NULL, NULL, NULL,                                                   'admin',   false)
  ON CONFLICT (id) DO UPDATE SET
    full_name          = EXCLUDED.full_name,
    department         = EXCLUDED.department,
    year_of_study      = EXCLUDED.year_of_study,
    roll_number        = EXCLUDED.roll_number,
    bio                = EXCLUDED.bio,
    role               = EXCLUDED.role,
    is_portfolio_public= EXCLUDED.is_portfolio_public;


  -- ── 3. Student Records ──────────────────────────────────────
  -- Priya Sharma — CS Y3 — High achiever (expect A+ engagement)
  INSERT INTO public.student_records
    (user_id, title, category, date, description, institution_name,
     verification_status, verification_confidence, verification_notes, verified_at, verified_by)
  VALUES
    (u_priya, 'AWS Certified Solutions Architect – Associate',
     'Certifications', '2024-08-15',
     'Passed the AWS SAA-C03 exam on the first attempt with a score of 847/1000.',
     'Amazon Web Services',
     'auto_verified', 91,
     'Certificate clearly shows student name, AWS logo, and exam date. Type: certificate. Confidence: 91%',
     now() - INTERVAL '30 days', NULL),

    (u_priya, 'First Place – Smart India Hackathon 2024',
     'Competitions', '2024-09-10',
     'Led a 6-member team to build an AI-based crop disease detection system. National winner.',
     'Ministry of Education, India',
     'auto_verified', 96,
     'Award letter confirms first place with team composition and national scope. Confidence: 96%',
     now() - INTERVAL '25 days', NULL),

    (u_priya, 'Google Developer Student Club Lead',
     'Leadership Roles', '2024-07-01',
     'Selected as GDSC Lead for Presidency University 2024-25 batch.',
     'Google Developers',
     'manual_verified', NULL,
     'Verified by faculty — appointment letter confirmed.',
     now() - INTERVAL '60 days', u_teacher),

    (u_priya, 'React.js Advanced Patterns – Coursera',
     'Certifications', '2024-06-20',
     'Completed specialisation covering React hooks, context API, and performance optimisation.',
     'Coursera / Meta',
     'auto_verified', 88,
     'Screenshot shows course completion with name visible. Confidence: 88%',
     now() - INTERVAL '70 days', NULL),

    (u_priya, 'International Conference on AI – Paper Presentation',
     'Conferences & Workshops', '2024-11-05',
     'Presented research paper on federated learning for edge IoT devices.',
     'Springer ICAI 2024',
     'needs_review', 72,
     'Conference programme visible but student name not clearly legible. Confidence: 72%',
     now() - INTERVAL '5 days', NULL),

  -- Rahul Nair — ECE Y2
    (u_rahul, 'Arduino & IoT Workshop',
     'Conferences & Workshops', '2024-04-12',
     'Two-day hands-on workshop on Arduino programming and IoT sensor integration.',
     'Texas Instruments India',
     'auto_verified', 89,
     'Participation certificate with printed name and date. Confidence: 89%',
     now() - INTERVAL '120 days', NULL),

    (u_rahul, 'IEEE Student Branch – Technical Head',
     'Leadership Roles', '2024-08-01',
     'Appointed Technical Head of the IEEE Student Branch, Presidency University.',
     'IEEE Bangalore Section',
     'auto_verified', 87,
     'Appointment letter on IEEE letterhead with branch details confirmed. Confidence: 87%',
     now() - INTERVAL '60 days', NULL),

    (u_rahul, 'National Robotics Competition – Finalist',
     'Competitions', '2024-03-20',
     'Reached the finals of the ABU Robocon India qualifying round.',
     'All India Council for Robotics & Automation',
     'needs_review', 64,
     'Certificate image partially cropped; rank visible but full name unclear. Confidence: 64%',
     now() - INTERVAL '10 days', NULL),

    (u_rahul, 'PCB Design & Simulation – NPTEL',
     'Certifications', '2024-09-30',
     'Completed 12-week NPTEL certification on PCB design with 82% score.',
     'NPTEL / IIT Madras',
     'auto_verified', 93,
     'NPTEL certificate with enrollment ID and score clearly visible. Confidence: 93%',
     now() - INTERVAL '15 days', NULL),

  -- Sneha Patel — CS Y4 — Top of class
    (u_sneha, 'Dean''s List – Academic Excellence Award',
     'Academic Excellence', '2024-05-20',
     'Recognised for maintaining 9.4 CGPA across all three completed years.',
     'Presidency University',
     'manual_verified', NULL,
     'Faculty manually verified academic transcript.',
     now() - INTERVAL '90 days', u_teacher),

    (u_sneha, 'Internship – Software Engineer Intern at Infosys',
     'Internships', '2024-05-15',
     'Worked on microservices migration for a banking client. 8-week paid internship.',
     'Infosys Ltd, Bangalore',
     'auto_verified', 94,
     'Offer letter with CTC, joining date, and student name confirmed. Confidence: 94%',
     now() - INTERVAL '100 days', NULL),

    (u_sneha, 'Full Stack Web Development Bootcamp',
     'Certifications', '2023-12-10',
     'Completed 6-month intensive bootcamp covering Node.js, React, and PostgreSQL.',
     'Scaler Academy',
     'auto_verified', 86,
     'Certificate with course duration and skills mentioned. Confidence: 86%',
     now() - INTERVAL '150 days', NULL),

    (u_sneha, 'Open Source Contributor – Apache Foundation',
     'Club Activities', '2024-02-14',
     'Merged 3 pull requests into Apache Kafka documentation repository.',
     'Apache Software Foundation',
     'rejected', 31,
     'GitHub screenshot does not clearly identify the submitting student. Confidence: 31%',
     now() - INTERVAL '80 days', NULL),

    (u_sneha, 'TechFest 2024 – Hackathon Winner',
     'Competitions', '2024-01-28',
     'Won first prize in 24-hour national level hackathon for AI-powered health monitoring.',
     'IIT Bombay TechFest',
     'auto_verified', 97,
     'Winner certificate with event name, date, and first-place rank. Confidence: 97%',
     now() - INTERVAL '90 days', NULL),

  -- Arjun Kumar — Mech Y2
    (u_arjun, 'AutoCAD Professional Certification',
     'Certifications', '2024-07-05',
     'Passed Autodesk AutoCAD 2024 certification exam.',
     'Autodesk',
     'auto_verified', 92,
     'Certificate from Autodesk with exam ID and student name. Confidence: 92%',
     now() - INTERVAL '55 days', NULL),

    (u_arjun, 'BAJA SAE India – Design Team Member',
     'Competitions', '2024-02-10',
     'Part of the Presidency University off-road vehicle team; achieved 14th rank nationally.',
     'Society of Automotive Engineers India',
     'needs_review', 58,
     'Team photo submitted; individual name not in document. Confidence: 58%',
     now() - INTERVAL '20 days', NULL),

    (u_arjun, 'Mechanical Engg Society – Events Coordinator',
     'Club Activities', '2024-08-15',
     'Organised inter-departmental technical quiz and model expo events.',
     'Presidency University',
     'auto_verified', 85,
     'Appointment letter from department HOD confirms role. Confidence: 85%',
     now() - INTERVAL '40 days', NULL),

  -- Divya Reddy — MBA Y3 — High engagement
    (u_divya, 'TEDx Presidency University – Speaker',
     'Leadership Roles', '2024-10-05',
     'Delivered a 12-minute talk on "The Economics of Social Entrepreneurship".',
     'TEDx Presidency University',
     'auto_verified', 95,
     'TEDx event programme and speaker confirmation letter verified. Confidence: 95%',
     now() - INTERVAL '10 days', NULL),

    (u_divya, 'National Entrepreneurship Challenge – Runner Up',
     'Competitions', '2024-09-18',
     'Pitched EdTech startup to panel of VCs and industry experts. Runner-up among 200 teams.',
     'IIM Bangalore',
     'auto_verified', 90,
     'Certificate of merit with IIM Bangalore letterhead and rank. Confidence: 90%',
     now() - INTERVAL '12 days', NULL),

    (u_divya, 'NSS Special Camp – Community Service',
     'Community Service', '2024-01-20',
     'Led a 7-day rural community development camp in Hassan district.',
     'National Service Scheme, Karnataka',
     'manual_verified', NULL,
     'NSS coordinator confirmed participation and leadership role.',
     now() - INTERVAL '110 days', u_teacher),

    (u_divya, 'Google Digital Marketing Certification',
     'Certifications', '2024-03-30',
     'Completed Google Ads and Analytics certifications through Google Skillshop.',
     'Google Skillshop',
     'auto_verified', 91,
     'Google Skillshop certificate with student email and completion date. Confidence: 91%',
     now() - INTERVAL '95 days', NULL),

    (u_divya, 'Business Analytics Workshop – IIM Kozhikode',
     'Conferences & Workshops', '2024-06-15',
     'Two-day intensive on predictive analytics and tableau dashboards.',
     'IIM Kozhikode Executive Programme',
     'auto_verified', 88,
     'Workshop certificate with venue, dates, and student name. Confidence: 88%',
     now() - INTERVAL '75 days', NULL),

  -- Karthik Menon — CS Y1 — Just getting started
    (u_karthik, 'Python for Beginners – Udemy',
     'Certifications', '2024-08-20',
     'Completed 100-hour Python programming course.',
     'Udemy',
     'auto_verified', 83,
     'Udemy certificate screenshot shows course name and completion. Confidence: 83%',
     now() - INTERVAL '30 days', NULL),

    (u_karthik, 'CSI Student Branch Membership',
     'Club Activities', '2024-09-01',
     'Joined Computer Society of India student branch as first-year member.',
     'Computer Society of India',
     'unverified', NULL, NULL, NULL, NULL),

    (u_karthik, 'Code-a-Thon 2024 – Participant',
     'Competitions', '2024-11-10',
     'Participated in college-level coding competition. Ranked 23rd out of 180.',
     'Presidency University',
     'needs_review', 55,
     'Participation certificate exists but confidence score low due to low image quality. Confidence: 55%',
     now() - INTERVAL '2 days', NULL),

  -- Ananya Singh — Civil Y4 — Community focused
    (u_ananya, 'Best NSS Volunteer Award – University Level',
     'Academic Excellence', '2024-04-15',
     'Awarded Best Volunteer for 200+ hours of community service.',
     'Presidency University NSS',
     'manual_verified', NULL,
     'Award certificate and service log verified by NSS coordinator.',
     now() - INTERVAL '60 days', u_teacher),

    (u_ananya, 'Habitat for Humanity – Construction Drive',
     'Community Service', '2024-03-08',
     'Volunteered for 15 days building affordable housing in rural Karnataka.',
     'Habitat for Humanity India',
     'auto_verified', 89,
     'Volunteer certificate with organisation letterhead and dates. Confidence: 89%',
     now() - INTERVAL '85 days', NULL),

    (u_ananya, 'ASCE Student Chapter – Secretary',
     'Leadership Roles', '2024-07-20',
     'Elected Secretary of the ASCE student chapter for academic year 2024-25.',
     'American Society of Civil Engineers',
     'auto_verified', 86,
     'ASCE chapter appointment letter with student name and role. Confidence: 86%',
     now() - INTERVAL '50 days', NULL),

    (u_ananya, 'Sustainability in Civil Engineering – IIT Roorkee Workshop',
     'Conferences & Workshops', '2023-12-20',
     'Attended 3-day workshop on green building materials and LEED certification.',
     'IIT Roorkee CEP',
     'auto_verified', 90,
     'Workshop certificate with IIT Roorkee branding and dates. Confidence: 90%',
     now() - INTERVAL '130 days', NULL),

    (u_ananya, 'Flood Relief Operations – Wayanad',
     'Community Service', '2024-08-05',
     'Part of student relief team providing food and medical support to flood-affected families.',
     'District Disaster Management Authority, Wayanad',
     'needs_review', 67,
     'News article submitted as evidence. Cannot directly verify student participation. Confidence: 67%',
     now() - INTERVAL '8 days', NULL),

  -- Vikram Iyer — ECE Y3
    (u_vikram, 'VLSI Design Internship – Qualcomm',
     'Internships', '2024-05-20',
     'Summer internship working on digital logic verification for 5G modem chipsets.',
     'Qualcomm India, Hyderabad',
     'auto_verified', 96,
     'Offer letter on Qualcomm letterhead with internship details. Confidence: 96%',
     now() - INTERVAL '80 days', NULL),

    (u_vikram, 'ISRO Space Hackathon – Top 10 Finalist',
     'Competitions', '2024-07-30',
     'Developed a satellite imagery analysis model using deep learning. Top 10 nationally.',
     'ISRO / Indian Space Research Organisation',
     'auto_verified', 93,
     'Certificate from ISRO with finalist rank and team name. Confidence: 93%',
     now() - INTERVAL '45 days', NULL),

    (u_vikram, 'Embedded C and RTOS – Udemy Advanced',
     'Certifications', '2024-04-10',
     'Advanced certification in FreeRTOS and STM32 microcontroller programming.',
     'Udemy / Kiran Simha',
     'auto_verified', 85,
     'Certificate shows course title and completion date. Confidence: 85%',
     now() - INTERVAL '100 days', NULL),

    (u_vikram, 'IEEE Signal Processing Society – Paper Co-Author',
     'Conferences & Workshops', '2024-09-25',
     'Co-authored paper on adaptive noise cancellation submitted to IEEE SPS workshop.',
     'IEEE Signal Processing Society',
     'rejected', 28,
     'Abstract screenshot submitted; no official acceptance or participation document. Confidence: 28%',
     now() - INTERVAL '7 days', NULL),

  -- Meera Joshi — MBA Y2
    (u_meera, 'HubSpot Content Marketing Certification',
     'Certifications', '2024-06-10',
     'Completed HubSpot Academy course on content marketing strategy.',
     'HubSpot Academy',
     'auto_verified', 87,
     'HubSpot Academy certificate with badge ID and student name. Confidence: 87%',
     now() - INTERVAL '65 days', NULL),

    (u_meera, 'Marketing Club – Vice President',
     'Club Activities', '2024-08-01',
     'Elected VP of Marketing Club; organised national-level case study competition.',
     'Presidency University Marketing Club',
     'needs_review', 60,
     'Internal document submitted; requires faculty confirmation of election. Confidence: 60%',
     now() - INTERVAL '5 days', NULL),

    (u_meera, 'Teach for India – Weekend Volunteer',
     'Community Service', '2024-03-01',
     'Tutored underprivileged students in mathematics every weekend for 3 months.',
     'Teach for India',
     'auto_verified', 88,
     'Volunteer certificate from Teach for India confirming duration. Confidence: 88%',
     now() - INTERVAL '95 days', NULL),

  -- Rohan Das — Mech Y3
    (u_rohan, 'Inter-IIT Tech Meet – Mechanical Design Challenge',
     'Competitions', '2024-12-10',
     'Represented Presidency University at Inter-IIT Tech Meet. Secured 8th position.',
     'IIT Kharagpur',
     'needs_review', 73,
     'Participation certificate shows event but team rank not on certificate. Confidence: 73%',
     now() - INTERVAL '1 day', NULL),

    (u_rohan, 'CATIA V5 Certification – Dassault Systèmes',
     'Certifications', '2024-09-05',
     'Certified CATIA V5 user for advanced part and assembly modelling.',
     'Dassault Systèmes',
     'auto_verified', 92,
     'Official Dassault certification document with exam ID. Confidence: 92%',
     now() - INTERVAL '20 days', NULL),

    (u_rohan, 'SAE INDIA Collegiate Club Member',
     'Club Activities', '2024-08-10',
     'Active member of SAE India collegiate club participating in BAJA and SUPRA events.',
     'SAE India',
     'auto_verified', 85,
     'SAE India membership card and confirmation email. Confidence: 85%',
     now() - INTERVAL '45 days', NULL),

    (u_rohan, 'Additive Manufacturing Workshop – CMTI',
     'Conferences & Workshops', '2024-05-08',
     'Two-day workshop on FDM and SLA 3D printing technologies.',
     'Central Manufacturing Technology Institute, Bangalore',
     'auto_verified', 90,
     'Government institute certificate with workshop agenda attached. Confidence: 90%',
     now() - INTERVAL '90 days', NULL);

  RAISE NOTICE 'Seed data inserted successfully.';
  RAISE NOTICE 'Demo login: priya.sharma@demo.academix.in / AcademiX@2024';
  RAISE NOTICE 'Teacher login: dr.kavitha@demo.academix.in / AcademiX@2024';
  RAISE NOTICE 'Admin login: admin@demo.academix.in / AcademiX@2024';
  RAISE NOTICE 'NOTE: To promote your own account to admin, run:';
  RAISE NOTICE '  UPDATE public.profiles SET role = ''admin'' WHERE id = (SELECT id FROM auth.users WHERE email = ''your@email.com'');';

END $$;


-- ── Verify the seed ───────────────────────────────────────────
SELECT
  p.full_name,
  p.department,
  p.role,
  COUNT(sr.id)                                                               AS total_records,
  COUNT(CASE WHEN sr.verification_status IN ('auto_verified','manual_verified') THEN 1 END) AS verified,
  COUNT(CASE WHEN sr.verification_status = 'needs_review'   THEN 1 END)    AS needs_review,
  COUNT(CASE WHEN sr.verification_status = 'rejected'       THEN 1 END)    AS rejected
FROM public.profiles p
LEFT JOIN public.student_records sr ON sr.user_id = p.id
GROUP BY p.id, p.full_name, p.department, p.role
ORDER BY p.role, total_records DESC;
