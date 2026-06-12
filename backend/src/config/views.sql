-- Create employee_summary_view combining profiles, leave counts, and active asset allocations
CREATE OR REPLACE VIEW employee_summary_view AS
SELECT 
    u.id AS employee_id,
    u.name,
    u.email,
    d.department_name AS department,
    ep.designation,
    ep.phone,
    (SELECT COUNT(*) FROM leave_applications la WHERE la.employee_id = u.id) AS leave_count,
    (SELECT COUNT(*) FROM asset_allocations aa WHERE aa.employee_id = u.id AND aa.status = 'Active') AS asset_count
FROM users u
LEFT JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN departments d ON d.id = ep.department_id;
