-- Drop existing tables if they exist
DROP TABLE IF EXISTS approval_history;
DROP TABLE IF EXISTS leave_applications;
DROP TABLE IF EXISTS leave_balance;
DROP TABLE IF EXISTS employee_skills;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS employee_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- 1. Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO departments (department_name) VALUES
('Software Development'),
('Quality Assurance'),
('Human Resources'),
('Finance'),
('Digital Marketing'),
('Sales'),
('Operations'),
('Technical Support');

-- 2. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee'
);

INSERT INTO users (name,email,password,role) VALUES
('Pranay Gupta','pranay@isoftzone.com','123456','admin'),
('Rahul Sharma','rahul@isoftzone.com','123456','manager'),
('Priya Verma','priya@isoftzone.com','123456','hr'),
('Amit Patel','amit@isoftzone.com','123456','employee'),
('Neha Jain','neha@isoftzone.com','123456','employee'),
('Rohit Singh','rohit@isoftzone.com','123456','employee'),
('Anjali Gupta','anjali@isoftzone.com','123456','employee'),
('Vikas Mehta','vikas@isoftzone.com','123456','employee'),
('Pooja Shah','pooja@isoftzone.com','123456','employee'),
('Sandeep Kumar','sandeep@isoftzone.com','123456','employee');

-- 3. Employee Profiles
CREATE TABLE employee_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    address TEXT,
    designation VARCHAR(100),
    salary INT
);

INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) VALUES
(1,1,'9876543210','Indore','Director',150000),
(2,1,'9876543211','Indore','Project Manager',85000),
(3,3,'9876543212','Indore','HR Manager',70000),
(4,1,'9876543213','Indore','React Developer',45000),
(5,1,'9876543214','Indore','Node Developer',50000),
(6,2,'9876543215','Indore','QA Engineer',40000),
(7,5,'9876543216','Indore','Marketing Executive',35000),
(8,6,'9876543217','Indore','Sales Executive',38000),
(9,8,'9876543218','Indore','Support Engineer',32000),
(10,4,'9876543219','Indore','Accountant',42000);

-- 4. Skills
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL
);

INSERT INTO skills(skill_name) VALUES
('React'), ('NodeJS'), ('PostgreSQL'), ('JavaScript'), ('HTML'), 
('CSS'), ('MongoDB'), ('Python'), ('Testing'), ('Salesforce');

-- 5. Employee Skills
CREATE TABLE employee_skills (
    employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE
);

INSERT INTO employee_skills (employee_id,skill_id) VALUES
(4,1), (4,4), (4,5),
(5,2), (5,3), (5,4),
(6,9), (7,4), (8,10),
(9,2), (9,3), (10,8);

-- 6. Leave Types
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    leave_name VARCHAR(100) NOT NULL,
    total_days INT NOT NULL
);

INSERT INTO leave_types (leave_name,total_days) VALUES
('Casual Leave',12), ('Sick Leave',10), ('Earned Leave',15), ('Maternity Leave',90);

-- 7. Leave Balance
CREATE TABLE leave_balance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES users(id) ON DELETE CASCADE, -- User ID since leave relies on user
    leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
    available_days INT
);

INSERT INTO leave_balance (employee_id, leave_type_id, available_days) VALUES
(4,1,10), (4,2,8),
(5,1,12), (5,2,10),
(6,1,8),  (6,2,6),
(7,1,10), (7,2,7),
(8,1,12), (8,2,10);

-- 8. Leave Applications
CREATE TABLE leave_applications (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INT REFERENCES leave_types(id) ON DELETE SET NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days INT,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending'
);

INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status) VALUES
(4,1,'2026-06-01','2026-06-03',3,'Family Function','Approved'),
(5,2,'2026-06-10','2026-06-11',2,'Fever','Pending'),
(6,1,'2026-05-20','2026-05-21',2,'Personal Work','Approved'),
(7,1,'2026-06-15','2026-06-17',3,'Travel','Pending'),
(8,2,'2026-06-18','2026-06-20',3,'Medical','Rejected');

-- 9. Approval History
CREATE TABLE approval_history (
    id SERIAL PRIMARY KEY,
    leave_id INT REFERENCES leave_applications(id) ON DELETE CASCADE,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50),
    remarks TEXT
);

INSERT INTO approval_history (leave_id, approved_by, action, remarks) VALUES
(1,2,'Approved','Manager Approved'),
(1,3,'Approved','HR Approved'),
(3,2,'Approved','Manager Approved'),
(3,3,'Approved','HR Approved'),
(5,2,'Rejected','Insufficient Reason');

-- 10. Assets
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50),
    asset_name VARCHAR(200),
    asset_type VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'Available'
);

INSERT INTO assets (asset_code, asset_name, asset_type, purchase_date, purchase_cost, status) VALUES
('LAP-001', 'Dell XPS 15', 'Laptop', '2025-01-15', 120000.00, 'Allocated'),
('LAP-002', 'MacBook Pro M2', 'Laptop', '2025-02-10', 150000.00, 'Available'),
('MON-001', 'Dell UltraSharp 27', 'Monitor', '2025-01-20', 25000.00, 'Allocated'),
('MOU-001', 'Logitech MX Master 3', 'Mouse', '2025-01-25', 8000.00, 'Available');

-- 11. Asset Allocations
CREATE TABLE asset_allocations (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
    employee_id INT REFERENCES users(id) ON DELETE CASCADE,
    allocated_by INT REFERENCES users(id) ON DELETE SET NULL,
    allocated_date DATE,
    return_date DATE,
    status VARCHAR(50) DEFAULT 'Active'
);

INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_date, status) VALUES
(1, 4, 1, '2026-01-10', 'Active'),
(3, 4, 1, '2026-01-15', 'Active');

-- 12. Asset History
CREATE TABLE asset_history (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
    action VARCHAR(100),
    remarks TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO asset_history (asset_id, action, remarks, created_by) VALUES
(1, 'Assigned', 'Assigned laptop to Amit Patel', 1),
(3, 'Assigned', 'Assigned monitor to Amit Patel', 1);

-- 13. Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    action_type VARCHAR(50),
    record_id INT,
    old_data JSONB,
    new_data JSONB,
    performed_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Employee Summary View
CREATE OR REPLACE VIEW employee_summary AS
SELECT
    u.id as user_id,
    u.name,
    u.email,
    d.department_name,
    ep.designation
FROM users u
LEFT JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN departments d ON d.id = ep.department_id;

-- 16. Calculate Leave Balance Procedure
CREATE OR REPLACE FUNCTION calculate_leave_balance(emp_id INT, leave_type INT) 
RETURNS INT AS $$
DECLARE
    bal INT;
BEGIN
    SELECT available_days INTO bal
    FROM leave_balance
    WHERE employee_id = emp_id AND leave_type_id = leave_type;
    
    RETURN COALESCE(bal, 0);
END;
$$ LANGUAGE plpgsql;

-- 17. Attendance
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Present',
    UNIQUE(employee_id, date)
);
