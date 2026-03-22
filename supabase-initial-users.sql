-- Initial Users Setup for MDS SE Timeline
-- Run this SQL in your Supabase SQL Editor AFTER running supabase-schema.sql

-- Add password_changed column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Create initial users with temporary passwords
-- Note: You need to create these users through Supabase Auth Dashboard or API
-- This script just documents the users that need to be created

/*
IMPORTANT: Create these users manually in Supabase Dashboard:

1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. For each user below, enter:
   - Email
   - Password (use the temporary password listed)
   - Auto Confirm User: YES

Initial Users:
--------------
1. Email: rumalis@masholdings.com
   Temp Password: MAS@2024#Temp1

2. Email: SashikalaD@masholdings.com
   Temp Password: MAS@2024#Temp2

3. Email: himesham@masholdings.com
   Temp Password: MAS@2024#Temp3

4. Email: gihanhe@masholdings.com
   Temp Password: MAS@2024#Temp4

5. Email: WarunaD@masholdings.com
   Temp Password: MAS@2024#Temp5

6. Email: sehany@masholdings.com
   Temp Password: MAS@2024#Temp6

7. Email: nimanthawe@masholdings.com
   Temp Password: MAS@2024#Temp7

After creating users, they will be forced to change their password on first login.
*/

-- Alternative: Use Supabase Admin API to create users programmatically
-- You can use the following Node.js script:

/*
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Keep this secret!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const initialUsers = [
  { email: 'rumalis@masholdings.com', password: 'MAS@2024#Temp1' },
  { email: 'SashikalaD@masholdings.com', password: 'MAS@2024#Temp2' },
  { email: 'himesham@masholdings.com', password: 'MAS@2024#Temp3' },
  { email: 'gihanhe@masholdings.com', password: 'MAS@2024#Temp4' },
  { email: 'WarunaD@masholdings.com', password: 'MAS@2024#Temp5' },
  { email: 'sehany@masholdings.com', password: 'MAS@2024#Temp6' },
  { email: 'nimanthawe@masholdings.com', password: 'MAS@2024#Temp7' },
];

async function createInitialUsers() {
  for (const user of initialUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    } else {
      console.log(`Created user: ${user.email}`);
    }
  }
}

createInitialUsers();
*/
