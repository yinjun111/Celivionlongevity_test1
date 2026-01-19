// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Check if user is logged in
function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Please log in to book an appointment');
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(userStr);
}

// Booking state
let bookingState = {
    selectedDoctor: null,
    selectedDate: null,
    selectedTime: null,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1, // 1-12
    availableDates: []
};

let currentUser = null;

// Initialize booking page
document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;

    loadDoctors();
    setupEventListeners();
});

/**
 * Load doctors from API
 */
async function loadDoctors() {
    try {
        const response = await fetch(`${API_BASE_URL}/doctors`);
        const data = await response.json();

        if (data.success) {
            const selectElement = document.getElementById('doctorSelect');
            data.data.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.name;
                option.textContent = `${doctor.name} - ${doctor.specialization}`;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Doctor selection change
    document.getElementById('doctorSelect').addEventListener('change', function(e) {
        bookingState.selectedDoctor = e.target.value;
        bookingState.selectedDate = null;
        bookingState.selectedTime = null;

        if (bookingState.selectedDoctor) {
            document.getElementById('doctorNotSelected').style.display = 'none';
            document.getElementById('calendarContainer').style.display = 'block';
            document.getElementById('timeSlotsContainer').style.display = 'none';
            loadCalendar();
        } else {
            document.getElementById('doctorNotSelected').style.display = 'block';
            document.getElementById('calendarContainer').style.display = 'none';
        }

        updateMakeAppointmentButton();
    });

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        bookingState.currentMonth--;
        if (bookingState.currentMonth < 1) {
            bookingState.currentMonth = 12;
            bookingState.currentYear--;
        }
        loadCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        bookingState.currentMonth++;
        if (bookingState.currentMonth > 12) {
            bookingState.currentMonth = 1;
            bookingState.currentYear++;
        }
        loadCalendar();
    });

    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', handleFormSubmit);
}

/**
 * Load calendar for selected doctor and month
 */
async function loadCalendar() {
    try {
        // Fetch available dates for this doctor and month
        const response = await fetch(
            `${API_BASE_URL}/doctors/${encodeURIComponent(bookingState.selectedDoctor)}/available-dates?` +
            `year=${bookingState.currentYear}&month=${bookingState.currentMonth}`
        );

        const data = await response.json();

        if (data.success) {
            bookingState.availableDates = data.data.availableDates;
            renderCalendar();
        }
    } catch (error) {
        console.error('Error loading calendar:', error);
    }
}

/**
 * Render calendar grid
 */
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('currentMonth');

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthDisplay.textContent = `${monthNames[bookingState.currentMonth - 1]} ${bookingState.currentYear}`;

    // Clear calendar
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Get first day of month and number of days
    const firstDay = new Date(bookingState.currentYear, bookingState.currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(bookingState.currentYear, bookingState.currentMonth, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const dateStr = `${bookingState.currentYear}-${String(bookingState.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(bookingState.currentYear, bookingState.currentMonth - 1, day);

        // Check if date is in the past
        if (dateObj < today) {
            dayElement.classList.add('disabled');
        }
        // Check if date has availability
        else if (bookingState.availableDates.includes(dateStr)) {
            dayElement.classList.add('has-availability');
            dayElement.addEventListener('click', () => selectDate(dateStr));
        }
        // No availability
        else {
            dayElement.classList.add('disabled');
        }

        // Mark selected date
        if (dateStr === bookingState.selectedDate) {
            dayElement.classList.add('selected');
        }

        calendarGrid.appendChild(dayElement);
    }
}

/**
 * Select a date and load time slots
 */
async function selectDate(date) {
    bookingState.selectedDate = date;
    bookingState.selectedTime = null;

    // Re-render calendar to show selected date
    renderCalendar();

    // Load time slots for this date
    await loadTimeSlots(date);

    // Update button state
    updateMakeAppointmentButton();
}

/**
 * Load available time slots for a date
 */
async function loadTimeSlots(date) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/doctors/${encodeURIComponent(bookingState.selectedDoctor)}/available-slots?date=${date}`
        );

        const data = await response.json();

        if (data.success) {
            renderTimeSlots(data.data.slots, date);
        }
    } catch (error) {
        console.error('Error loading time slots:', error);
    }
}

/**
 * Render time slots
 */
function renderTimeSlots(slots, date) {
    const container = document.getElementById('timeSlotsContainer');
    const slotsGrid = document.getElementById('timeSlots');
    const dateDisplay = document.getElementById('selectedDateDisplay');

    // Format date for display
    const [year, month, day] = date.split('-').map(num => parseInt(num));
    const dateObj = new Date(year, month - 1, day);
    const dateFormatted = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    dateDisplay.textContent = `Available times for ${dateFormatted}`;

    // Clear previous slots
    slotsGrid.innerHTML = '';

    if (slots.length === 0) {
        slotsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No available time slots for this date</p>';

        // Remove this date from available dates since it has no slots
        const dateIndex = bookingState.availableDates.indexOf(date);
        if (dateIndex > -1) {
            bookingState.availableDates.splice(dateIndex, 1);
            renderCalendar();
        }
    } else {
        slots.forEach(time => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot-item';
            slotElement.textContent = formatTime(time);
            slotElement.dataset.time = time;

            slotElement.addEventListener('click', () => selectTime(time));

            if (time === bookingState.selectedTime) {
                slotElement.classList.add('selected');
            }

            slotsGrid.appendChild(slotElement);
        });
    }

    container.style.display = 'block';
}

/**
 * Select a time slot
 */
function selectTime(time) {
    bookingState.selectedTime = time;

    // Update UI
    document.querySelectorAll('.time-slot-item').forEach(slot => {
        slot.classList.remove('selected');
        if (slot.dataset.time === time) {
            slot.classList.add('selected');
        }
    });

    // Enable submit button
    updateMakeAppointmentButton();
}

/**
 * Format time for display
 */
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Update Make Appointment button state
 */
function updateMakeAppointmentButton() {
    const button = document.getElementById('makeAppointmentBtn');
    const canSubmit = bookingState.selectedDoctor && bookingState.selectedDate && bookingState.selectedTime;

    button.disabled = !canSubmit;

    if (canSubmit) {
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    } else {
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Hide previous messages
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    // Validate
    if (!bookingState.selectedDoctor || !bookingState.selectedDate || !bookingState.selectedTime) {
        showError('Please select a doctor, date, and time');
        return;
    }

    if (!currentUser || !currentUser.id) {
        showError('Please log in to book an appointment');
        window.location.href = 'login.html';
        return;
    }

    // Get form data
    const formData = {
        user_id: currentUser.id,
        doctor_name: bookingState.selectedDoctor,
        appointment_date: bookingState.selectedDate,
        appointment_time: bookingState.selectedTime,
        duration: 60,
        notes: document.getElementById('notes').value.trim()
    };

    // Show loading
    document.getElementById('loadingOverlay').style.display = 'flex';

    try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        document.getElementById('loadingOverlay').style.display = 'none';

        if (data.success) {
            showSuccess(`Appointment confirmed! You can view your appointments in your dashboard.`);

            // Reset form
            setTimeout(() => {
                window.location.href = 'dashboard.html#appointments';
            }, 2000);
        } else {
            showError(data.error || 'Failed to create appointment');
        }
    } catch (error) {
        console.error('Error submitting booking:', error);
        document.getElementById('loadingOverlay').style.display = 'none';
        showError('An error occurred. Please try again.');
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    successEl.textContent = message;
    successEl.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
