// Add this function to supabaseSync.js to convert camelCase to snake_case

// Add this method to the SupabaseSync class:
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapFieldsToSnakeCase(data) {
  const mapped = {};
  for (const key in data) {
    mapped[toSnakeCase(key)] = data[key];
  }
  return mapped;
}

// Then in insertRecord and updateRecord, wrap data:
// Instead of: .insert([{ ...data, household_id: this.householdId, ... }])
// Use:        .insert([{ ...mapFieldsToSnakeCase(data), household_id: this.householdId, ... }])
