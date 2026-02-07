/*
  # Complete PrimoJobs Database Schema Setup

  This migration creates all necessary tables and security policies for the PrimoJobs application.

  ## New Tables
  1. **users** - User profiles and authentication data
  2. **questions** - Practice questions with solutions
  3. **access_logs** - Payment and access tracking
  4. **materials** - Free learning materials
  5. **payment_settings** - Payment configuration and coupons

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users
  - Add admin-specific policies for content management

  ## Sample Data
  - Default payment settings with coupon codes
  - Sample questions for testing
  - Sample learning materials
*/

-- Create users table for user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coding', 'aptitude', 'interview', 'technical')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  solution_text TEXT NOT NULL,
  code_example TEXT,
  explanation TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  price NUMERIC DEFAULT 0 CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create access_logs table for tracking user access and payments
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  access_start_time TIMESTAMPTZ NOT NULL,
  access_expiry_time TIMESTAMPTZ NOT NULL,
  payment_status BOOLEAN DEFAULT FALSE,
  payment_id TEXT,
  amount_paid NUMERIC NOT NULL CHECK (amount_paid >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create materials table for free learning resources
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'interview-tips' CHECK (category IN ('interview-tips', 'coding-guide', 'aptitude-tricks', 'company-specific')),
  company TEXT,
  role TEXT,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_settings table for pricing and coupons
CREATE TABLE IF NOT EXISTS payment_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  base_price NUMERIC NOT NULL DEFAULT 49 CHECK (base_price > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  active_coupons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Anyone can read questions" ON questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
DROP POLICY IF EXISTS "Users can read own access logs" ON access_logs;
DROP POLICY IF EXISTS "Users can insert own access logs" ON access_logs;
DROP POLICY IF EXISTS "Anyone can read materials" ON materials;
DROP POLICY IF EXISTS "Admins can manage materials" ON materials;
DROP POLICY IF EXISTS "Anyone can read payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for questions table
CREATE POLICY "Anyone can read questions" ON questions 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage questions" ON questions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('admin@primojobs.com', 'your-admin-email@gmail.com')
    )
  );

-- Create policies for access_logs table
CREATE POLICY "Users can read own access logs" ON access_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own access logs" ON access_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for materials table
CREATE POLICY "Anyone can read materials" ON materials 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage materials" ON materials 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('admin@primojobs.com', 'your-admin-email@gmail.com')
    )
  );

-- Create policies for payment_settings table
CREATE POLICY "Anyone can read payment settings" ON payment_settings 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage payment settings" ON payment_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('admin@primojobs.com', 'your-admin-email@gmail.com')
    )
  );

-- Insert default payment settings
INSERT INTO payment_settings (id, base_price, currency, active_coupons) 
VALUES (
  '1', 
  49, 
  'INR', 
  '[
    {"code": "FREE100", "discount": 100, "description": "Free access"},
    {"code": "HALF50", "discount": 50, "description": "50% off"},
    {"code": "SAVE20", "discount": 20, "description": "20% discount"}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  currency = EXCLUDED.currency,
  active_coupons = EXCLUDED.active_coupons,
  updated_at = NOW();

-- Insert sample questions
INSERT INTO questions (company, role, category, difficulty, question_text, solution_text, code_example, explanation, tags, image_url, price) VALUES
(
  'TCS', 
  'Software Engineer', 
  'coding', 
  'medium',
  'Write a function to find the maximum element in an array.',
  'Use the built-in Math.max() function with spread operator to find the maximum value.',
  'function findMax(arr) {\n  if (arr.length === 0) return null;\n  return Math.max(...arr);\n}\n\n// Alternative approach using reduce\nfunction findMaxReduce(arr) {\n  if (arr.length === 0) return null;\n  return arr.reduce((max, current) => current > max ? current : max, arr[0]);\n}',
  'This problem can be solved in multiple ways. The simplest approach uses Math.max() with the spread operator. The spread operator (...) expands the array elements as individual arguments to Math.max(). An alternative approach uses the reduce() method to iterate through the array and keep track of the maximum value found so far.',
  ARRAY['array', 'math', 'javascript', 'algorithms'],
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
  49
),
(
  'Wipro', 
  'Data Analyst', 
  'aptitude', 
  'easy',
  'If a train travels 120 km in 2 hours, what is its speed?',
  'Speed = Distance / Time = 120 km / 2 hours = 60 km/h',
  '',
  'This is a basic speed calculation problem. Speed is calculated by dividing the total distance traveled by the total time taken. In this case: Speed = 120 km ÷ 2 hours = 60 km/h. This is a fundamental formula in physics and mathematics.',
  ARRAY['speed', 'distance', 'time', 'basic-math'],
  'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
  0
),
(
  'Infosys', 
  'System Engineer', 
  'interview', 
  'medium',
  'Explain the difference between SQL and NoSQL databases.',
  'SQL databases are relational with structured data and ACID properties. NoSQL databases are non-relational with flexible schema and eventual consistency.',
  '',
  'SQL databases (like MySQL, PostgreSQL) use structured query language and have a fixed schema with tables, rows, and columns. They follow ACID properties (Atomicity, Consistency, Isolation, Durability) ensuring data integrity. NoSQL databases (like MongoDB, Cassandra) are more flexible, can handle unstructured data, and are designed for horizontal scaling. They often use eventual consistency instead of immediate consistency.',
  ARRAY['database', 'sql', 'nosql', 'system-design'],
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
  0
),
(
  'Accenture', 
  'Software Developer', 
  'coding', 
  'hard',
  'Implement a function to reverse a linked list.',
  'Use iterative approach with three pointers: previous, current, and next.',
  'class ListNode {\n  constructor(val, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n\nfunction reverseLinkedList(head) {\n  let prev = null;\n  let current = head;\n  \n  while (current !== null) {\n    let next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  \n  return prev;\n}\n\n// Recursive approach\nfunction reverseLinkedListRecursive(head) {\n  if (!head || !head.next) return head;\n  \n  let newHead = reverseLinkedListRecursive(head.next);\n  head.next.next = head;\n  head.next = null;\n  \n  return newHead;\n}',
  'Reversing a linked list is a classic problem that can be solved iteratively or recursively. The iterative approach uses three pointers: prev (initially null), current (starts at head), and next (to store the next node). We iterate through the list, reversing the direction of each link. The recursive approach works by reversing the rest of the list first, then adjusting the current node''s connections.',
  ARRAY['linked-list', 'pointers', 'recursion', 'data-structures'],
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
  49
),
(
  'Cognizant', 
  'Business Analyst', 
  'aptitude', 
  'medium',
  'A company''s profit increased by 25% in the first year and decreased by 20% in the second year. What is the overall percentage change?',
  'Overall change = (1.25 × 0.80 - 1) × 100% = 0% (no net change)',
  '',
  'To find the overall percentage change over multiple periods, we multiply the growth factors. First year: 25% increase means the new value is 125% of original (factor = 1.25). Second year: 20% decrease means the new value is 80% of previous (factor = 0.80). Overall factor = 1.25 × 0.80 = 1.00, which means no net change (0% overall change).',
  ARRAY['percentage', 'profit', 'business-math', 'compound-changes'],
  'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
  0
);

-- Insert sample materials
INSERT INTO materials (title, description, category, company, role, content, image_url) VALUES
(
  'Complete DSA Guide', 
  'Master data structures and algorithms with this comprehensive guide covering arrays, linked lists, trees, graphs, and more.',
  'coding-guide',
  '',
  '',
  'This comprehensive guide covers all essential data structures and algorithms you need to know for technical interviews.\n\n## Arrays\n- Basic operations: insertion, deletion, searching\n- Two-pointer technique\n- Sliding window problems\n\n## Linked Lists\n- Singly and doubly linked lists\n- Common operations and edge cases\n- Cycle detection algorithms\n\n## Trees\n- Binary trees and binary search trees\n- Tree traversal methods (inorder, preorder, postorder)\n- Balanced trees (AVL, Red-Black)\n\n## Graphs\n- Graph representation (adjacency list, matrix)\n- BFS and DFS algorithms\n- Shortest path algorithms\n\n## Dynamic Programming\n- Memoization vs tabulation\n- Common DP patterns\n- Practice problems\n\nRemember: Practice consistently and understand the underlying concepts rather than memorizing solutions.',
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'
),
(
  'Interview Tips & Tricks', 
  'Ace your technical interviews with these proven strategies and common question patterns.',
  'interview-tips',
  '',
  '',
  'Here are essential tips to help you succeed in technical interviews:\n\n## Before the Interview\n- Research the company and role thoroughly\n- Practice coding on a whiteboard or paper\n- Review your resume and be ready to discuss projects\n- Prepare questions to ask the interviewer\n\n## During the Interview\n- Think out loud and explain your approach\n- Start with a brute force solution, then optimize\n- Ask clarifying questions about requirements\n- Test your solution with examples\n- Handle edge cases\n\n## Common Question Types\n- Array and string manipulation\n- Tree and graph traversal\n- Dynamic programming\n- System design (for senior roles)\n\n## Behavioral Questions\n- Use the STAR method (Situation, Task, Action, Result)\n- Prepare stories about challenges, failures, and successes\n- Show leadership and teamwork examples\n\n## After the Interview\n- Send a thank-you email within 24 hours\n- Reflect on what went well and areas for improvement\n- Follow up appropriately if you don''t hear back\n\nRemember: Interviews are conversations, not interrogations. Stay calm and confident!',
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'
),
(
  'TCS Specific Preparation Guide', 
  'Everything you need to know about TCS interview process, coding standards, and company culture.',
  'company-specific',
  'TCS',
  'Software Engineer',
  'TCS (Tata Consultancy Services) Interview Preparation Guide\n\n## Company Overview\n- One of India''s largest IT services companies\n- Focus on digital transformation and innovation\n- Strong emphasis on continuous learning\n\n## Interview Process\n1. **Online Assessment**\n   - Aptitude questions (quantitative, logical reasoning)\n   - Basic programming questions\n   - English comprehension\n\n2. **Technical Interview**\n   - Programming fundamentals (C, Java, Python)\n   - Database concepts (SQL queries)\n   - Web technologies (HTML, CSS, JavaScript)\n   - Object-oriented programming concepts\n\n3. **HR Interview**\n   - Why TCS?\n   - Career goals and aspirations\n   - Willingness to relocate\n   - Team collaboration scenarios\n\n## Common Technical Topics\n- Data structures and algorithms\n- DBMS concepts and SQL\n- Operating system fundamentals\n- Networking basics\n- Software engineering principles\n\n## Coding Standards\n- Write clean, readable code\n- Use meaningful variable names\n- Add comments for complex logic\n- Handle edge cases and exceptions\n\n## Tips for Success\n- Be honest about your skills and experience\n- Show enthusiasm for learning new technologies\n- Demonstrate problem-solving approach\n- Ask thoughtful questions about the role\n\nGood luck with your TCS interview!',
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_company ON questions(company);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_question_id ON access_logs(question_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_expiry ON access_logs(access_expiry_time);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);