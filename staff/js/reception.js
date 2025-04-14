document.addEventListener('DOMContentLoaded', async () => {
  const table = $('#bookingTable').DataTable();
  const tableBody = document.querySelector('#bookingTable tbody');

  try {
    const res = await fetch('/api/bookings');
    const bookings = await res.json();
    console.log("📦 Bookings received:", bookings);
    window.bookings = bookings;

    bookings.forEach(b => {
      const newRow = table.row.add([
        b.b_ref ?? 'N/A',
        b.c_name ?? 'N/A',
        b.r_no ?? 'N/A',
        b.r_class ?? 'N/A',
        b.check_in ?? 'N/A',
        b.check_out ?? 'N/A',
        b.nights ?? 'N/A',
        b.guests ?? 'N/A',
        `<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); checkIn('${b.b_ref}')">Check-In</button>
         <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); cancelBooking('${b.b_ref}')">Cancel</button>`
      ]).draw().node();

      // Add class and ID for clickability
      newRow.classList.add('clickable-row');
      $(newRow).attr('data-id', b.b_ref);
    });

    // ✅ Use event delegation for dynamically added rows
    $('#bookingTable tbody').on('click', 'tr.clickable-row', function (e) {
      if (!$(e.target).is('button')) {
        const bookingRef = $(this).data('id');
        if (bookingRef) {
          window.location.href = `/staff/reception/booking/${bookingRef}`;
        }
      }
    });

  } catch (err) {
    console.error("❌ Failed to load bookings:", err);
    tableBody.innerHTML = '<tr><td colspan="9">Error loading bookings</td></tr>';
  }
});

async function cancelBooking(b_ref) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  try {
    const res = await fetch(`/api/booking/${b_ref}`, { method: 'DELETE' });
    const result = await res.json();
    if (res.ok) {
      alert('Booking cancelled.');
      location.reload();
    } else {
      alert(result.message || 'Cancellation failed.');
    }
  } catch (err) {
    alert('Something went wrong.');
  }
}

function checkIn(b_ref) {
  alert(`Check-in logic not yet implemented for booking: ${b_ref}`);
}
