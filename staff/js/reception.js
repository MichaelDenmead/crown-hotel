document.addEventListener('DOMContentLoaded', async () => {
  // Set up DataTable sorted by Booking Ref (descending)
  const table = $('#bookingTable').DataTable({
    order: [[0, 'desc']],
    pageLength: getPageLengthFromStorage(), // Get saved page length from localStorage
    responsive: {
      details: {
        type: 'column' // Use columns for responsiveness
      }
    },
    columnDefs: [
      { responsivePriority: 1, targets: 0 }, // Booking Ref - highest priority
      { responsivePriority: 2, targets: 10 }, // Actions - third most important
      { responsivePriority: 3, targets: 1 }, // Name - second most important
      { responsivePriority: 4, targets: 2 }, // Room No
      { responsivePriority: 5, targets: 3 }, // Room Type
      { responsivePriority: 6, targets: 4 }, // Check-in
      { responsivePriority: 7, targets: 5 }, // Check-out
      { responsivePriority: 8, targets: 6 }, // Nights
      { responsivePriority: 9, targets: 7 }, // Guests
      { responsivePriority: 10, targets: 8 }, // Total (£)
      { responsivePriority: 11, targets: 9 }  // Outstanding (£)
    ]
  });

  // Set dropdown to match stored value for page length
  $('#bookingTable_length select').val(getPageLengthFromStorage()).trigger('change');

  const filterSelect = document.getElementById('filter');
  let allBookings = [];

  // Filter logic separated into a reusable function
  function applyFilter(filter) {
    const today = new Date().toISOString().slice(0, 10);
    let filtered = [...allBookings];

    if (filter === 'checkin_today') {
      filtered = filtered.filter(b => b.check_in === today);
    } else if (filter === 'checkout_today') {
      filtered = filtered.filter(b => b.check_out === today);
    }

    renderTable(filtered);
  }

  try {
    // Fetch bookings from server
    const response = await fetch('/api/bookings');
    allBookings = await response.json();

    //renderTable(allBookings); // Show all by default

  // Restore saved filter from localStorage
  const savedFilter = localStorage.getItem('bookingFilter');
  if (savedFilter) {
    filterSelect.value = savedFilter;
    applyFilter(savedFilter);
  } else {
    renderTable(allBookings); // Default if no saved filter
  }

  // Listen for dropdown changes and apply filter + save to localStorage
  filterSelect?.addEventListener('change', () => {
    const filter = filterSelect.value;
    localStorage.setItem('bookingFilter', filter); // Save selection
    applyFilter(filter);
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
        row.classList.add('table-success');  // Green for check-ins
      } else if (b.check_out === today) {
        row.classList.add('table-danger'); // Red for check-outs
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
    

  // Fetch and update data periodically every 60 seconds
  setInterval(fetchData, 60000);

  // Manual refresh button logic
  document.getElementById('refreshButton').addEventListener('click', fetchData);

  // Fetch updated data from server and render it
  async function fetchData() {
    try {
      const response = await fetch('/api/bookings');
      const newBookings = await response.json();
      allBookings = newBookings; // Update the main data array
  
      const savedFilter = localStorage.getItem('bookingFilter');
      if (savedFilter) {
        applyFilter(savedFilter); // Apply saved filter to fresh data
      } else {
        renderTable(allBookings); // No filter, show all
      }
    } catch (err) {
      console.error('Error loading bookings data:', err);
      document.querySelector('#bookingTable tbody').innerHTML = '<tr><td colspan="11">Error loading bookings</td></tr>';
    }
  }

  // Handle page length change and save it to localStorage
  $('#bookingTable_length select').on('change', function () {
      const selectedLength = $(this).val();
      table.page.len(selectedLength).draw();
      savePageLengthToStorage(selectedLength);
  });

});

// Function to save selected page length to localStorage
function savePageLengthToStorage(pageLength) {
localStorage.setItem('pageLength', pageLength);
}

// Function to retrieve page length from localStorage
function getPageLengthFromStorage() {
return localStorage.getItem('pageLength') || 10; // Default to 10 if no value found
}


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
