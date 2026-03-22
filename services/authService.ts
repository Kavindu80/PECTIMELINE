import { supabase } from './supabaseClient';

// Initial users with temporary passwords
export const INITIAL_USERS = [
  { email: 'rumalis@masholdings.com', tempPassword: 'MAS@2024#Temp1' },
  { email: 'SashikalaD@masholdings.com', tempPassword: 'MAS@2024#Temp2' },
  { email: 'himesham@masholdings.com', tempPassword: 'MAS@2024#Temp3' },
  { email: 'gihanhe@masholdings.com', tempPassword: 'MAS@2024#Temp4' },
  { email: 'WarunaD@masholdings.com', tempPassword: 'MAS@2024#Temp5' },
  { email: 'sehany@masholdings.com', tempPassword: 'MAS@2024#Temp6' },
  { email: 'nimanthawe@masholdings.com', tempPassword: 'MAS@2024#Temp7' },
];

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Check if user needs to change password (first login)
export const needsPasswordChange = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    // Check if user has changed password from temp password in user_metadata
    const passwordChanged = user.user_metadata?.password_changed;
    
    // If there is no password_changed flag explicitly set to true, they need to change it
    // This now applies to all users (both test users and newly created ones from the dashboard)
    if (passwordChanged !== true) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking password change status:', error);
    return false;
  }
};

// Change password
export const changePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_changed: true } // Update the user metadata directly
    });

    if (error) throw error;

    // Wait a moment for the metadata to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    return data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Validate password strength
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return { valid: true, message: 'Password is strong' };
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Send password reset email
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });
  if (error) throw error;
  return data;
};
