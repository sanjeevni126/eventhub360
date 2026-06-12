-- 1. Create Index on Employee Email (guarantees indexing on uniqueness check)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Create Index on Department ID in employee profiles (improves department filter joins)
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department_id ON employee_profiles(department_id);

-- 3. Create Index on Leave Applications status (improves leaves dashboard & query filtration)
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON leave_applications(status);

-- 4. Create Index on Assets category (asset_type) (speeds up category filtering)
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);
