/* =========================================================
   MOTofix SIGNUP CONTROLLER (LocalStorage Version)
   - Validates the form fields on the client side
   - Saves data locally, completely prepped to swap for PHP/MySQL later
========================================================= */
// Account fields and backend replacement notes: ../BACKEND_DATA_CONTRACT.md

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.querySelector("form");

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignupSubmission);
    }
});

function handleSignupSubmission(event) {
    // 1. Stop the page from reloading like it normally does on submit
    event.preventDefault();

    // 2. Grab all user inputs using their IDs from the form
    const firstName = document.getElementById("firstName").value.trim();
    const middleName = document.getElementById("middleName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const age = document.getElementById("age").value.trim();
    const gender = document.getElementById("gender").value;
    const suffix = document.getElementById("suffix").value || "";
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const motoModel = document.getElementById("motoModel").value.trim();
    const plateNumber = document.getElementById("plateNumber").value.trim();

    // 3. Do some quick validation checks (make sure passwords match and are long enough)
    if (password !== confirmPassword) {
        alert("Wait, passwords don't match!");
        return;
    }

    if (password.length < 6) {
        alert("Password is too short. Make it at least 6 characters.");
        return;
    }

    // 4. Build the user object (structured just like our future MySQL table columns)
    const newUser = {
        id: generateUniqueId(),
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        name: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName} ${suffix}`.trim(),
        email: email,
        age: parseInt(age, 10),
        gender: gender,
        suffix: suffix,
        password: password, // Note: In PHPMyAdmin / backend, we'll use password_hash()
        moto_model: motoModel || "None specified",
        plate_number: plateNumber || "Unregistered",
        role: "Customer",
        created_at: new Date().toISOString().split('T')[0]
    };

    // Send it over to our local "database" function
    saveUserToDatabaseMock(newUser);
}

/**
 * DATABASE ABSTRACTION LAYER (Mock Edition)
 * Acts like our database table handler for now using LocalStorage.
 * FOR DEFENSE MIGRATION: Swap this function out with a fetch() POST 
 * request pointing to our register.php script connected to PHPMyAdmin!
 */
function saveUserToDatabaseMock(userData) {
    // motofix_users is the common account source read by login and dashboard role lookups.
    // Grab existing users from local storage or initialize an empty array if empty
    let users = JSON.parse(localStorage.getItem("motofix_users")) || [];

    // Check if someone's already using this email address
    const emailExists = users.some(user => user.email.toLowerCase() === userData.email.toLowerCase());
    
    if (emailExists) {
        alert("An account with this email already exists!");
        return;
    }

    // Push the new user (simulating an SQL INSERT query)
    users.push(userData);
    
    // Commit to storage so it stays persistent
    localStorage.setItem("motofix_users", JSON.stringify(users));
    try {
        const deletedAccounts = JSON.parse(localStorage.getItem("motofix_deleted_accounts") || "[]");
        if (Array.isArray(deletedAccounts)) {
            localStorage.setItem(
                "motofix_deleted_accounts",
                JSON.stringify(deletedAccounts.filter((email) => String(email).trim().toLowerCase() !== userData.email.toLowerCase())),
            );
        }
    } catch (error) {
        console.error("Could not clear the deleted-account marker for the new account:", error);
    }
    try {
        const replacedEmails = JSON.parse(localStorage.getItem("motofix_replaced_emails") || "[]");
        if (Array.isArray(replacedEmails)) {
            localStorage.setItem(
                "motofix_replaced_emails",
                JSON.stringify(replacedEmails.filter((email) => String(email).trim().toLowerCase() !== userData.email.toLowerCase())),
            );
        }
    } catch (error) {
        console.error("Could not clear the replaced-email marker for the new account:", error);
    }

    // Save current session state so the app knows who's logged in
    localStorage.setItem("motofix_current_user", JSON.stringify(userData));

    // Pop up a success message and bounce them over to the login page
    alert("Account created successfully! Welcome to MotoFix.");
    
    /* 
      PHPMyAdmin Migration Note for Defense:
      When hooking up PHP, replace local storage calls above with:
      
      fetch('api/register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
      })
      .then(res => res.json())
      .then(data => { if(data.success) window.location.href = 'login.html'; });
    */

    // Redirect to login page
    window.location.href = "login.html";
}

// Helper function to generate a safe unique ID for the new row
function generateUniqueId() {
    let users = JSON.parse(localStorage.getItem("motofix_users")) || [];
    if (users.length === 0) return 1;
    const maxId = Math.max(...users.map(u => u.id || 0));
    return maxId + 1;
}