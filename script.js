let currentDate = new Date();
let selectedDate = null;
let activities = {}; // Store activities by date string

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Storage functions with enhanced error handling and logging
function saveActivities() {
    try {
        const dataToSave = JSON.stringify(activities);
        localStorage.setItem('calendarActivities', dataToSave);
        console.log('Activities saved successfully:', Object.keys(activities).length, 'dates');
        return true;
    } catch (error) {
        console.error('Failed to save activities:', error);
        alert('Failed to save activities: ' + error.message);
        return false;
    }
}

function loadActivities() {
    try {
        const stored = localStorage.getItem('calendarActivities');
        console.log('Raw stored data:', stored);

        if (stored) {
            const parsedData = JSON.parse(stored);
            activities = parsedData;
            console.log('Activities loaded successfully:', Object.keys(activities).length, 'dates');
        } else {
            console.log('No stored activities found, starting with empty object');
            activities = {};
        }
    } catch (error) {
        console.error('Failed to load activities:', error);
        activities = {}; // Reset to empty if loading fails
        alert('Failed to load saved activities. Starting fresh.');
    }
}

function formatDate(date) {
    // Use proper local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatDisplayDate(dateStr) {
    // Parse the date string properly to avoid timezone issues
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getTodayDateString() {
    // Get today's date in local timezone
    const today = new Date();
    return formatDate(today);
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');

    // Clear calendar
    calendar.innerHTML = '';

    // Set month/year display
    monthYear.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    // Add day headers
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Get today's date string for comparison
    const today = getTodayDateString();

    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = date.getDate();

        const dateStr = formatDate(date);

        // Add classes
        if (date.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }

        if (dateStr === today) {
            dayElement.classList.add('today');
        }

        if (selectedDate === dateStr) {
            dayElement.classList.add('selected');
        }

        if (activities[dateStr] && activities[dateStr].length > 0) {
            dayElement.classList.add('has-activities');
        }

        // Add click event
        dayElement.addEventListener('click', () => selectDate(dateStr));

        calendar.appendChild(dayElement);
    }
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    document.getElementById('selectedDate').textContent = formatDisplayDate(dateStr);
    document.getElementById('activityForm').style.display = 'block';
    renderCalendar();
    renderActivities();
}

function renderActivities() {
    const activitiesList = document.getElementById('activitiesList');

    if (!selectedDate || !activities[selectedDate] || activities[selectedDate].length === 0) {
        activitiesList.innerHTML = '<div class="no-activities">No activities for this date</div>';
        return;
    }

    const sortedActivities = activities[selectedDate].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    activitiesList.innerHTML = sortedActivities.map((activity, index) => `
                <div class="activity-item">
                    <div class="activity-header">
                        <span class="activity-time">${formatTime(new Date(activity.timestamp))}</span>
                        <div>
                            ${activity.duration ? `<span class="activity-duration">${activity.duration}</span>` : ''}
                            <button class="delete-btn" onclick="deleteActivity(${index})">Delete</button>
                        </div>
                    </div>
                    <div class="activity-description">${activity.description}</div>
                </div>
            `).join('');
}

function addActivity() {
    if (!selectedDate) return;

    const description = document.getElementById('activityDesc').value.trim();
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;

    if (!description) {
        alert('Please enter an activity description');
        return;
    }

    const activity = {
        description: description,
        timestamp: new Date().toISOString(),
        duration: hours > 0 || minutes > 0 ? `${hours}h ${minutes}m` : null
    };

    if (!activities[selectedDate]) {
        activities[selectedDate] = [];
    }

    activities[selectedDate].push(activity);

    // Save to localStorage
    saveActivities();

    // Clear form
    document.getElementById('activityDesc').value = '';
    document.getElementById('hours').value = '';
    document.getElementById('minutes').value = '';

    renderCalendar();
    renderActivities();
}

function deleteActivity(index) {
    if (!selectedDate || !activities[selectedDate]) return;

    activities[selectedDate].splice(index, 1);

    if (activities[selectedDate].length === 0) {
        delete activities[selectedDate];
    }

    // Save to localStorage
    saveActivities();

    renderCalendar();
    renderActivities();
}

// Export/Import functions for backup
function exportActivities() {
    const dataStr = JSON.stringify(activities, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calendar-activities.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importActivities(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validate the data structure
            if (typeof importedData === 'object' && importedData !== null) {
                // Merge with existing activities or replace
                if (confirm('Do you want to merge with existing activities? Click Cancel to replace all activities.')) {
                    // Merge mode
                    Object.keys(importedData).forEach(date => {
                        if (!activities[date]) {
                            activities[date] = [];
                        }
                        activities[date] = activities[date].concat(importedData[date]);
                    });
                } else {
                    // Replace mode
                    activities = importedData;
                }

                saveActivities();
                renderCalendar();
                renderActivities();
                alert('Activities imported successfully!');
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Clear all data function
function clearAllActivities() {
    if (confirm('Are you sure you want to delete ALL activities? This cannot be undone.')) {
        activities = {};
        saveActivities();
        renderCalendar();
        renderActivities();
        alert('All activities have been cleared.');
    }
}

// Navigation event listeners
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Allow Enter key to add activity
document.getElementById('activityDesc').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        addActivity();
    }
});

// Auto-resize textarea function
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(80, textarea.scrollHeight) + 'px';
}

// Initialize calendar - multiple approaches to ensure it runs
function initializeCalendar() {
    console.log('Initializing calendar...');

    // Load activities from localStorage first
    loadActivities();
    console.log('Loaded activities:', activities);

    // Then render the calendar
    renderCalendar();

    console.log('Calendar initialized');
}

// Try multiple initialization methods to ensure it works
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalendar);
} else {
    // DOM is already loaded
    initializeCalendar();
}

// Backup initialization in case DOMContentLoaded doesn't fire
window.addEventListener('load', function () {
    // Only initialize if calendar is empty (hasn't been initialized yet)
    const calendar = document.getElementById('calendar');
    if (calendar && calendar.innerHTML === '') {
        console.log('Backup initialization triggered');
        initializeCalendar();
    }
});

// Test localStorage functionality
function testLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('localStorage is working');
        return true;
    } catch (e) {
        console.error('localStorage is not available:', e);
        alert('localStorage is not available. Data will not persist between sessions.');
        return false;
    }
}

// Test localStorage on page load
testLocalStorage();