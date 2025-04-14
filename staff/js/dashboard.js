document.addEventListener("DOMContentLoaded", function () {
    const roleSelect = document.getElementById("role-select");
    const contentDiv = document.getElementById("dashboard-content");

    // Only run this script if these elements exist (i.e. on the dashboard page)
    if (!roleSelect || !contentDiv) return;

    // Function to update content based on role
    function updateDashboard(role) {
        if (role === "receptionist") {
            contentDiv.innerHTML = `
                <h2>Reception Panel</h2>
                <p>Manage bookings, guest check-ins, and customer service.</p>
                <button onclick="alert('Booking system coming soon!')">Manage Bookings</button>
            `;
        } else if (role === "cleaner") {
            contentDiv.innerHTML = `
                <h2>Cleaner Panel</h2>
                <p>View and change room status. Possibly report issues and request supplies.</p>
                <button onclick="alert('Task list coming soon!')">View Tasks</button>
            `;
        } else {
            contentDiv.innerHTML = "<p>Please select a role.</p>";
        }
    }

    // Load default role-based content
    roleSelect.addEventListener("change", () => updateDashboard(roleSelect.value));
    
    // Set default to Receptionist
    updateDashboard(roleSelect.value);
});
