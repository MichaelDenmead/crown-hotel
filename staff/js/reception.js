document.addEventListener('DOMContentLoaded', async () => {
  // Set up DataTable sorted by Booking Ref (descending)
  const table = $('#bookingTable').DataTable({
    order: [[0, 'desc']]
  });

  const filterSelect = document.getElementById('filter');
  let allBookings = [];

  try {
    // Fetch bookings from server
    const response = await fetch('/api/bookings');
    allBookings = await response.json();

    renderTable(allBookings); // Show all by default

    // Apply filters when dropdown changes
    filterSelect?.addEventListener('change', () => {
      const filter = filterSelect.value;
      const today = new Date().toISOString().slice(0, 10);
      let filtered = [...allBookings];

      if (filter === 'checkin_today') {
        filtered = filtered.filter(b => b.check_in === today);
      } else if (filter === 'checkout_today') {
        filtered = filtered.filter(b => b.check_out === today);
      }

      renderTable(filtered);
    });

  } catch (err) {
    console.error('Error loading bookings:', err);
    document.querySelector('#bookingTable tbody').innerHTML = '<tr><td colspan="11">Error loading bookings</td></tr>';
  }

  // Render table with given booking data
  function renderTable(data) {
    table.clear().draw();
    const today = new Date().toISOString().slice(0, 10);

    data.forEach(b => {
      const row = table.row.add([
        b.b_ref || 'N/A',
        b.c_name || 'N/A',
        b.r_no || 'N/A',
        b.r_class || 'N/A',
        b.check_in || 'N/A',
        b.check_out || 'N/A',
        b.nights || 'N/A',
        b.guests || 'N/A',
        b.b_cost || 'N/A',
        b.b_outstanding || 'N/A',
        `<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); checkIn('${b.b_ref}')">Check-In</button>
         <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); checkOut('${b.b_ref}')">Check-Out</button>`
      ]).draw().node();

      row.classList.add('clickable-row');
      row.setAttribute('data-id', b.b_ref);

      // Highlight today's check-in/out using Bootstrap classes
      if (b.check_in === today) {
        row.classList.add('table-success');  // Green
      } else if (b.check_out === today) {
        row.classList.add('table-danger'); // Yellow
      }
    });
  }

  // Handle row click → go to booking detail page
  $('#bookingTable tbody').on('click', 'tr.clickable-row', function (e) {
    if (!e.target.closest('button')) {
      const bookingRef = this.dataset.id;
      if (bookingRef) {
        window.location.href = `/staff/reception/booking/${bookingRef}`;
      }
    }
  });
});

// Check-In (updates room status to occupied)
async function checkIn(b_ref) {
  if (!confirm('Check this guest in and mark the room as occupied?')) return;

  try {
    const res = await fetch(`/api/booking/${b_ref}/checkin`, { method: 'PUT' });
    const result = await res.json();

    if (res.ok) {
      alert('Guest checked in.');
      location.reload();
    } else {
      alert(result.message || 'Check-in failed.');
    }
  } catch (err) {
    alert('Error during check-in.');
  }
}

// Check-Out (updates room status to cleaned + clears balance)
async function checkOut(b_ref) {
  if (!confirm('Check this guest out and mark room for cleaning?')) return;

  try {
    const res = await fetch(`/api/booking/${b_ref}/checkout`, { method: 'PUT' });
    const result = await res.json();

    if (res.ok) {
      alert('Guest checked out.');
      location.reload();
    } else {
      alert(result.message || 'Check-out failed.');
    }
  } catch (err) {
    alert('Error during check-out.');
  }
}
