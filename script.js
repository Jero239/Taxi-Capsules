// Script for Taxi Capsules

// Redirect the book button to the booking page
const bookBtn = document.getElementById('book-btn');
if (bookBtn) {
    bookBtn.addEventListener('click', function() {
        window.location.href = 'services.html';
    });
}

// Handling the reservation form
const bookingForm = document.getElementById('bookingForm') || document.querySelector('.reservation-form');
if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(bookingForm);
        const booking = {
            id: Date.now(),
            firstname: formData.get('firstname') || '',
            lastname: formData.get('lastname') || '',
            address: formData.get('address') || formData.get('departure') || '',
            destination: formData.get('destination') || formData.get('arrival') || '',
            vehicle: formData.get('vehicle') || 'Not specified',
            time: formData.get('time') || '',
            bookingType: formData.get('bookingType') || 'normal',
            datetime: formData.get('datetime') || '',
            status: 'pending'
        };

        // Save to localStorage
        let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        showNotification('Your reservation request has been sent!', 'success');
        bookingForm.reset();
    });
}

// Function to check admin password
function checkAdminPassword() {
    showAdminModal();
}

function ensureAdminModal() {
    if (document.getElementById('admin-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'admin-modal';
    overlay.className = 'popup-overlay';
    overlay.style.display = 'none';
    overlay.addEventListener('click', hideAdminModal);

    const modal = document.createElement('div');
    modal.className = 'popup-content admin-modal-content';
    modal.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    modal.innerHTML = `
        <span class="close-btn" onclick="hideAdminModal()">&times;</span>
        <h3>Admin Login</h3>
        <p>Enter the admin password to access the control panel.</p>
        <input id="admin-password-input" type="password" placeholder="Admin password" autocomplete="current-password" />
        <div class="modal-actions">
            <button type="button" onclick="submitAdminPassword()">Enter</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const passwordInput = document.getElementById('admin-password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitAdminPassword();
            }
        });
    }
}

function showAdminModal() {
    ensureAdminModal();
    const overlay = document.getElementById('admin-modal');
    const input = document.getElementById('admin-password-input');
    overlay.style.display = 'flex';
    setTimeout(() => {
        input.focus();
    }, 100);
}

function hideAdminModal() {
    const overlay = document.getElementById('admin-modal');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function submitAdminPassword() {
    const passwordInput = document.getElementById('admin-password-input');
    const password = passwordInput ? passwordInput.value.trim() : '';
    hideAdminModal();
    if (password === '0000') {
        window.location.href = 'admin.html';
    } else {
        showNotification('Incorrect password.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `site-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 250);
    }, 3200);
}

// Display requests in the admin panel
function loadBookings() {
    const normalList = document.getElementById('normal-list');
    const tripList = document.getElementById('trip-list');
    if (!normalList || !tripList) return;

    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    normalList.innerHTML = '';
    tripList.innerHTML = '';

    const normalBookings = bookings.filter(b => b.bookingType !== 'trip');
    const tripBookings = bookings.filter(b => b.bookingType === 'trip');

    if (normalBookings.length === 0) {
        normalList.innerHTML = '<p>No normal bookings at the moment.</p>';
    } else {
        normalBookings.forEach(booking => {
            const item = createBookingItem(booking);
            normalList.appendChild(item);
        });
    }

    if (tripBookings.length === 0) {
        tripList.innerHTML = '<p>No trip bookings at the moment.</p>';
    } else {
        tripBookings.forEach(booking => {
            const item = createBookingItem(booking);
            tripList.appendChild(item);
        });
    }
}

function createBookingItem(booking) {
    const item = document.createElement('div');
    item.className = 'booking-item';
    const vehicleDisplay = booking.vehicle && booking.vehicle !== 'Not specified' ?
        (booking.vehicle === 'aerien' ? 'Aerial' : booking.vehicle === 'terrestre' ? 'Ground' : booking.vehicle)
        : 'Not specified';
    item.innerHTML = `
        <h4>${booking.firstname} ${booking.lastname}</h4>
        <p><strong>From:</strong> ${booking.address}</p>
        <p><strong>To:</strong> ${booking.destination}</p>
        <p><strong>Vehicle type:</strong> ${vehicleDisplay}</p>
        <p><strong>Time:</strong> ${booking.time || 'Not specified'}</p>
        <p><strong>Status:</strong> ${booking.status === 'pending' ? 'Pending' : booking.status === 'accepted' ? 'Accepted' : 'Rejected'}</p>
        <div class="booking-actions">
            <button onclick="updateStatus(${booking.id}, 'accepted')">Accept</button>
            <button onclick="updateStatus(${booking.id}, 'rejected')">Reject</button>
        </div>
    `;
    return item;
}

function updateStatus(id, status) {
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const bookingIndex = bookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
        const booking = bookings[bookingIndex];
        booking.status = status;
        if (status === 'accepted') {
            if (booking.address && booking.destination) {
                const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(booking.address)}/${encodeURIComponent(booking.destination)}`;
                window.open(mapsUrl, '_blank');
            }
            bookings.splice(bookingIndex, 1);
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Request accepted', {
                    body: `The request from ${booking.firstname} ${booking.lastname} has been accepted.`,
                });
            } else {
                showNotification(`Request accepted for ${booking.firstname} ${booking.lastname}`, 'success');
            }
        } else if (status === 'rejected') {
            bookings.splice(bookingIndex, 1);
            showNotification(`Request rejected for ${booking.firstname} ${booking.lastname}`, 'error');
        }
        localStorage.setItem('bookings', JSON.stringify(bookings));
        loadBookings();
    }
}

// Load requests on admin page load
if (document.getElementById('bookings-container') || document.getElementById('normal-list') || document.getElementById('trip-list')) {
    loadBookings();
    // Request permission for notifications
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Functions for hours popup
function showHoursPopup() {
    document.getElementById('hours-popup').style.display = 'flex';
}

function hideHoursPopup() {
    document.getElementById('hours-popup').style.display = 'none';
}

function selectTrip(destination) {
    localStorage.setItem('selectedDestination', destination);
    localStorage.setItem('selectedDeparture', 'Amsterdam');
    window.location.href = 'trip-booking.html';
}