import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { initializeSync } from '../lib/supabaseSync';

const HouseholdContext = createContext(null);

export const useHousehold = () => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be within HouseholdProvider');
  return ctx;
};

export const HouseholdProvider = ({ children }) => {
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserHouseholds();
  }, []);

  const loadUserHouseholds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: members, error } = await supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          households (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const hhList = (members || []).map(m => ({
        ...m.households,
        role: m.role,
        memberId: m.household_id
      }));

      setHouseholds(hhList);

      if (hhList.length > 0 && !currentHousehold) {
        setCurrentHousehold(hhList[0]);
        // Initialize sync after household is set
        setTimeout(() => initializeSync(), 100);
      } else if (hhList.length === 0) {
        // Create default household automatically
        const household = await createHousehold('My Household');
        setCurrentHousehold(household);
        await loadUserHouseholds();
      }
    } catch (err) {
      console.error('Failed to load households:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async (name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    try {
      const { data: household, error } = await supabase
        .from('households')
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('household_members').insert({
        household_id: household.id,
        user_id: user.id,
        role: 'owner'
      });

      // Refresh list then trigger sync
      await loadUserHouseholds();
      
      return household;
    } catch (err) {
      console.error('Failed to create household:', err);
      throw err;
    }
  };

  const joinHousehold = async (inviteCode) => {
    throw new Error('Invite system not yet implemented. Use Supabase Dashboard to add member manually.');
  };

  const switchHousehold = async (household) => {
    setCurrentHousehold(household);
    window.dispatchEvent(new Event('household-changed'));
    // Re-initialize sync with new household
    setTimeout(() => initializeSync(), 100);
  };

  const leaveHousehold = async (householdId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('household_members')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', user.id);

    if (currentHousehold?.id === householdId) {
      setCurrentHousehold(null);
    }
    await loadUserHouseholds();
  };

  const value = {
    currentHousehold,
    households,
    loading,
    error,
    createHousehold,
    joinHousehold,
    switchHousehold,
    leaveHousehold,
    refreshHouseholds: loadUserHouseholds
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};
