// Run this when the page is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize DataTable on the bookings table
  const table = $('#bookingTable').DataTable();
  const tableBody = document.querySelector('#bookingTable tbody');

  try {
    // Fetch all bookings from the backend
    const res = await fetch('/api/bookings');
    const bookings = await res.json();
    console.log("📦 Bookings received:", bookings);

    // Add each booking as a new row in the table
    bookings.forEach(b => {
      table.row.add([
        b.b_ref ?? 'N/A',
        b.c_name ?? 'N/A',
        b.r_no ?? 'N/A',
        b.r_class ?? 'N/A',
        b.check_in ?? 'N/A',
        b.check_out ?? 'N/A',
        b.nights ?? 'N/A',
        b.guests ?? 'N/A',
        // Buttons for actions
        `<button class="btn btn-sm btn-success" onclick="checkIn('${b.b_ref}')">Check-In</button>
         <button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.b_ref}')">Cancel</button>`
      ]);
    });

    table.draw(); // Redraw table to show new data
  } catch (err) {
    console.error("❌ Failed to load bookings:", err);
    // Show error in table if loading fails
    tableBody.innerHTML = '<tr><td colspan="9">Error loading bookings</td></tr>';
  }
});

// Cancel a booking by reference
async function cancelBooking(b_ref) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  try {
    const res = await fetch(`/api/booking/${b_ref}`, { method: 'DELETE' });
    const result = await res.json();
    if (res.ok) {
      alert('Booking cancelled.');
      location.reload(); // Refresh the page to update the table
    } else {
      alert(result.message || 'Cancellation failed.');
    }
  } catch (err) {
    alert('Something went wrong.');
  }
}

// Placeholder for future check-in logic
function checkIn(b_ref) {
  alert(`Check-in logic not yet implemented for booking: ${b_ref}`);
}
