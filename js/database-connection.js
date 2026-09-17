// Responsible solely for data operations (fetching, adding, deleting). 
// Right now it uses mock data, but later you will swap the function bodies with fetch() calls.

let mockDatabaseMechanics = [
  { id: 1, name: "Ramon Santos", email: "mechanic1@motofix.com", status: "Active" },
  { id: 2, name: "Dante Cruz", email: "mechanic2@motofix.com", status: "Active" }
];

export async function fetchMechanics() {
  // FUTURE DATABASE SWAP: return fetch('/api/mechanics').then(res => res.json());
  return Promise.resolve([...mockDatabaseMechanics]);
}

export async function addMechanic(mechanicData) {
  // FUTURE DATABASE SWAP: return fetch('/api/mechanics', { method: 'POST', ... });
  const newId = mockDatabaseMechanics.length > 0 ? mockDatabaseMechanics[mockDatabaseMechanics.length - 1].id + 1 : 1;
  const newEntry = { id: newId, ...mechanicData, status: "Active" };
  mockDatabaseMechanics.push(newEntry);
  return Promise.resolve(newEntry);
}

export async function removeMechanic(id) {
  // FUTURE DATABASE SWAP: return fetch(`/api/mechanics/${id}`, { method: 'DELETE' });
  mockDatabaseMechanics = mockDatabaseMechanics.filter(m => m.id !== id);
  return Promise.resolve(true);
}