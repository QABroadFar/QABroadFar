-- ============================================
-- FIX: Remove problematic RLS policies and apply corrected ones
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Household owners can manage members" ON household_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON household_members;

-- Apply the corrected policies (non-recursive)
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own memberships
CREATE POLICY "Users can view own memberships" ON household_members FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert themselves as members (needed for household creation)
CREATE POLICY "Users can insert themselves" ON household_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow household owners to manage other members (non-recursive)
CREATE POLICY "Owners can manage members" ON household_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM households h
    WHERE h.id = household_members.household_id AND h.created_by = auth.uid()
  )
);

-- Verify the fix by checking if we can now query household_members
-- This should work without infinite recursion errors
SELECT COUNT(*) FROM household_members LIMIT 1;
