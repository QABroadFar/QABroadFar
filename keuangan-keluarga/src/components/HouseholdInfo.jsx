import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';

export default function HouseholdInfo() {
  const { currentHousehold, households, loading, error } = useHousehold();
  const { user } = useAuth();

  if (loading) return <p>Loading household...</p>;
  if (error) return <p>Error: {error}</p>;

  if (!currentHousehold) {
    return (
      <div className="household-info">
        <p>You are not in any household yet.</p>
        <p className="text-sm text-gray-500">
          Contact your partner to add you via Supabase Dashboard, or create a new household.
        </p>
      </div>
    );
  }

  return (
    <div className="household-info">
      <h3>Current Household</h3>
      <p><strong>Name:</strong> {currentHousehold.name}</p>
      <p><strong>Role:</strong> {currentHousehold.role}</p>
      <p className="text-sm text-gray-500">
        Household ID: {currentHousehold.id}
      </p>
      
      {households.length > 1 && (
        <div className="mt-4">
          <h4>Switch Household</h4>
          <ul className="household-list">
            {households.map(hh => (
              <li key={hh.id}>
                <button onClick={() => switchHousehold(hh)}>
                  {hh.name} ({hh.role})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
