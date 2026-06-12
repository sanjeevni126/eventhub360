const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Seeding dummy departments...");
    // Departments are already created by schema.sql, let's fetch their ids
    const deptsRes = await client.query('SELECT id, department_name FROM departments');
    const departments = deptsRes.rows;
    console.log("Existing departments:", departments.map(d => d.department_name));

    console.log("Generating dummy employees...");
    const dummyEmployees = [
      { name: 'John Doe', email: 'john.doe@example.com', deptName: 'Software Development', designation: 'Senior Developer', salary: 85000, city: 'Pune', mode: 'Remote' },
      { name: 'Bob Smith', email: 'bob.smith@example.com', deptName: 'Human Resources', designation: 'HR Assistant', salary: 75000, city: 'Pune', mode: 'Hybrid' },
      { name: 'Alice Johnson', email: 'alice.j@example.com', deptName: 'Quality Assurance', designation: 'QA Lead', salary: 65000, city: 'Indore', mode: 'Onsite' },
      { name: 'Kofi Anan', email: 'kofi.anan@example.com', deptName: 'Software Development', designation: 'Backend Engineer', salary: 95000, city: 'Bengaluru', mode: 'Remote' },
      { name: 'Chloe Tan', email: 'chloe.tan@example.com', deptName: 'Digital Marketing', designation: 'UI Designer', salary: 58000, city: 'Mumbai', mode: 'Hybrid' },
      { name: 'Raj Patel', email: 'raj.patel@example.com', deptName: 'Finance', designation: 'Financial Analyst', salary: 72000, city: 'Bhopal', mode: 'Onsite' },
      { name: 'Sunita Rao', email: 'sunita.rao@example.com', deptName: 'Sales', designation: 'Sales Manager', salary: 80000, city: 'Jaipur', mode: 'Hybrid' },
      { name: 'David Lee', email: 'david.lee@example.com', deptName: 'Technical Support', designation: 'Support Lead', salary: 50000, city: 'Delhi', mode: 'Remote' },
      { name: 'Sarah Jenkins', email: 'sarah.j@example.com', deptName: 'Operations', designation: 'Operations Specialist', salary: 62000, city: 'Hyderabad', mode: 'Onsite' },
      { name: 'Emma Watson', email: 'emma.w@example.com', deptName: 'Digital Marketing', designation: 'SEO Specialist', salary: 48000, city: 'Pune', mode: 'Remote' },
      { name: 'Kabir Khan', email: 'kabir.k@example.com', deptName: 'Software Development', designation: 'Fullstack Developer', salary: 110000, city: 'Mumbai', mode: 'Hybrid' },
      { name: 'Linda Vance', email: 'linda.v@example.com', deptName: 'Finance', designation: 'Senior Accountant', salary: 89000, city: 'Bengaluru', mode: 'Onsite' },
      { name: 'Marcus Aurelius', email: 'marcus.a@example.com', deptName: 'Operations', designation: 'Ops Director', salary: 125000, city: 'Indore', mode: 'Remote' },
      { name: 'Tariq Malik', email: 'tariq.m@example.com', deptName: 'Sales', designation: 'Account Executive', salary: 55000, city: 'Jaipur', mode: 'Hybrid' },
      { name: 'Yuki Sato', email: 'yuki.sato@example.com', deptName: 'Quality Assurance', designation: 'Automation Engineer', salary: 68000, city: 'Bhopal', mode: 'Onsite' }
    ];

    const hashedPassword = await bcrypt.hash('123456', 10);

    for (const emp of dummyEmployees) {
      // Avoid duplicate users
      const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [emp.email]);
      let userId;
      if (userCheck.rows.length === 0) {
        const userRes = await client.query(
          `INSERT INTO users (name, email, password, role) 
           VALUES ($1, $2, $3, 'employee') RETURNING id`,
          [emp.name, emp.email, hashedPassword]
        );
        userId = userRes.rows[0].id;
        console.log(`Created user ${emp.name} (ID: ${userId})`);
      } else {
        userId = userCheck.rows[0].id;
        console.log(`User ${emp.name} already exists (ID: ${userId})`);
      }

      // Find department ID
      const deptObj = departments.find(d => d.department_name.toLowerCase() === emp.deptName.toLowerCase());
      const deptId = deptObj ? deptObj.id : null;

      // Update or Insert employee profile
      const profileCheck = await client.query('SELECT id FROM employee_profiles WHERE user_id = $1', [userId]);
      if (profileCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary, working_mode) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, deptId, '9876500000', emp.city, emp.designation, emp.salary, emp.mode]
        );
        console.log(`Created profile for user ID: ${userId}`);
      } else {
        await client.query(
          `UPDATE employee_profiles 
           SET department_id = $1, address = $2, designation = $3, salary = $4, working_mode = $5 
           WHERE user_id = $6`,
          [deptId, emp.city, emp.designation, emp.salary, emp.mode, userId]
        );
        console.log(`Updated profile for user ID: ${userId}`);
      }

      // Seed mock attendance records for the past 3 days (June 10, June 11, June 12)
      const dates = ['2026-06-10', '2026-06-11', '2026-06-12'];
      for (const d of dates) {
        const attCheck = await client.query('SELECT id FROM attendance WHERE employee_id = $1 AND date = $2', [userId, d]);
        if (attCheck.rows.length === 0) {
          // Calculate random check-in/out times
          const hourIn = 8 + Math.floor(Math.random() * 2); // 8 or 9 AM
          const minIn = Math.floor(Math.random() * 60);
          const hourOut = 17 + Math.floor(Math.random() * 2); // 5 or 6 PM
          const minOut = Math.floor(Math.random() * 60);
          
          const pad = (num) => String(num).padStart(2, '0');
          
          const inTime = new Date(`${d}T${pad(hourIn)}:${pad(minIn)}:00.000Z`);
          const outTime = new Date(`${d}T${pad(hourOut)}:${pad(minOut)}:00.000Z`);
          
          // 85% chance they are Present, 15% Absent
          const status = Math.random() > 0.15 ? 'Present' : 'Absent';

          await client.query(
            `INSERT INTO attendance (employee_id, date, check_in_time, check_out_time, status) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, d, status === 'Present' ? inTime : null, status === 'Present' ? outTime : null, status]
          );
        }
      }
    }

    console.log("Seeding dummy assets...");
    const dummyAssets = [
      { code: 'LAP-003', name: 'ThinkPad X1 Carbon', type: 'Laptop', purchaseDate: '2025-03-01', cost: 135000.00, status: 'Available' },
      { code: 'LAP-004', name: 'HP EliteBook 840', type: 'Laptop', purchaseDate: '2025-03-15', cost: 95000.00, status: 'Available' },
      { code: 'LAP-005', name: 'Dell Latitude 7440', type: 'Laptop', purchaseDate: '2025-04-01', cost: 115000.00, status: 'Available' },
      { code: 'MON-002', name: 'LG UltraFine 32', type: 'Monitor', purchaseDate: '2025-02-18', cost: 45000.00, status: 'Available' },
      { code: 'MON-003', name: 'Samsung Odyssey G5', type: 'Monitor', purchaseDate: '2025-03-20', cost: 32000.00, status: 'Available' },
      { code: 'KEY-001', name: 'Keychron K2 Wireless', type: 'Keyboard', purchaseDate: '2025-04-05', cost: 7500.00, status: 'Available' },
      { code: 'KEY-002', name: 'Logitech G Pro Mechanical', type: 'Keyboard', purchaseDate: '2025-04-10', cost: 9000.00, status: 'Available' },
      { code: 'MOU-002', name: 'Razer DeathAdder V2', type: 'Mouse', purchaseDate: '2025-03-10', cost: 5000.00, status: 'Available' },
      { code: 'HDS-001', name: 'Jabra Evolve2 65', type: 'Headset', purchaseDate: '2025-03-22', cost: 15000.00, status: 'Available' },
      { code: 'HDS-002', name: 'Sony WH-1000XM4', type: 'Headset', purchaseDate: '2025-03-25', cost: 22000.00, status: 'Available' },
      { code: 'CAM-001', name: 'Logitech C920 HD Pro', type: 'Webcam', purchaseDate: '2025-02-28', cost: 7000.00, status: 'Available' },
      { code: 'CHR-001', name: 'Herman Miller Aeron', type: 'Chair', purchaseDate: '2025-01-10', cost: 85000.00, status: 'Available' },
      { code: 'CHR-002', name: 'Steelcase Gesture', type: 'Chair', purchaseDate: '2025-02-15', cost: 78000.00, status: 'Available' }
    ];

    for (const asset of dummyAssets) {
      const assetCheck = await client.query('SELECT id FROM assets WHERE asset_code = $1', [asset.code]);
      if (assetCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO assets (asset_code, asset_name, asset_type, purchase_date, purchase_cost, status) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [asset.code, asset.name, asset.type, asset.purchaseDate, asset.cost, asset.status]
        );
        console.log(`Created asset: ${asset.name} (${asset.code})`);
      } else {
        console.log(`Asset ${asset.code} already exists, skipping.`);
      }
    }

    await client.query('COMMIT');
    console.log("Dummy data seeding completed successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Seeding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
