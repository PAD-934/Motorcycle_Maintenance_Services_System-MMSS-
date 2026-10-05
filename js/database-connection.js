const MASTER_EMPLOYEE_STORAGE_KEY = "motofix_master_employees";

// Master Control owns this employee collection. Dashboard account creation also
// mirrors employees into motofix_users; keep this adapter's IDs and role/status
// fields compatible with that shared authentication record until a backend exists.
function readEmployees() {
  try {
    const employees = JSON.parse(
      localStorage.getItem(MASTER_EMPLOYEE_STORAGE_KEY) || "[]",
    );
    return Array.isArray(employees) ? employees : [];
  } catch {
    return [];
  }
}

function writeEmployees(employees) {
  localStorage.setItem(MASTER_EMPLOYEE_STORAGE_KEY, JSON.stringify(employees));
}

export async function fetchMechanics() {
  return readEmployees();
}

export async function addMechanic(mechanicData) {
  const employees = readEmployees();
  const newId = employees.reduce((maximum, employee) => Math.max(maximum, Number(employee.id) || 0), 0) + 1;
  const newEmployee = { id: newId, ...mechanicData, status: "Active" };
  employees.push(newEmployee);
  writeEmployees(employees);
  return newEmployee;
}

export async function removeMechanic(id) {
  writeEmployees(readEmployees().filter((employee) => Number(employee.id) !== Number(id)));
  return true;
}