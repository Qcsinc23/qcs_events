/**
 * Operations Dashboard JavaScript
 * Manages the comprehensive event management interface
 */

class OperationsDashboard {
    constructor() {
        this.operationsAgent = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.currentEditingEvent = null;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Operations Agent
            this.operationsAgent = new OperationsAgent();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Generate calendar
            this.generateCalendar();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            console.log('Operations Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Operations Dashboard:', error);
            this.showNotification('Failed to initialize dashboard', 'error');
        }
    }

    async loadDashboardData() {
        // Load statistics
        this.updateStatistics();
        
        // Load events table
        this.loadEventsTable();
        
        // Update calendar
        this.updateCalendarEvents();
    }

    updateStatistics() {
        if (!this.operationsAgent) return;
        
        const events = this.operationsAgent.getEvents();
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Calculate statistics
        const totalEvents = events.length;
        const activeEvents = events.filter(e => ['confirmed', 'in-progress'].includes(e.status)).length;
        const todayEvents = events.filter(e => e.schedule?.start_date === today).length;
        
        // Calculate monthly revenue (estimated)
        const monthlyEvents = events.filter(e => {
            const eventDate = new Date(e.schedule?.start_date);
            return eventDate.getMonth() === currentMonth && 
                   eventDate.getFullYear() === currentYear &&
                   e.status === 'completed';
        });
        const estimatedRevenue = monthlyEvents.reduce((total, event) => {
            return total + (event.quote?.final_cost || event.quote?.estimated_cost || 500);
        }, 0);
        
        // Update UI
        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('activeEvents').textContent = activeEvents;
        document.getElementById('todayEvents').textContent = todayEvents;
        document.getElementById('revenueThisMonth').textContent = `$${estimatedRevenue.toLocaleString()}`;
    }

    loadEventsTable() {
        if (!this.operationsAgent) return;
        
        const events = this.operationsAgent.getEvents();
        const tableBody = document.getElementById('eventsTableBody');
        
        if (events.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                        No events found. Create your first event to get started!
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = events.map(event => this.createEventRow(event)).join('');
    }

    createEventRow(event) {
        const statusClass = `status-${event.status.replace('_', '-')}`;
        const eventDate = event.schedule?.start_date ? 
            new Date(event.schedule.start_date).toLocaleDateString() : 'Not set';
        
        return `
            <tr data-event-id="${event.id}">
                <td><strong>${event.id}</strong></td>
                <td>
                    <div>${event.client?.name || 'Unknown'}</div>
                    <div style="font-size: 0.8rem; color: #6b7280;">${event.client?.email || ''}</div>
                </td>
                <td>
                    <span class="status-badge" style="background: #e0e7ff; color: #5b21b6;">
                        ${this.getEventTypeDisplay(event.type)}
                    </span>
                </td>
                <td>${eventDate}</td>
                <td><span class="status-badge ${statusClass}">${event.status}</span></td>
                <td>
                    <span class="status-badge" style="background: ${this.getPriorityColor(event.priority)};">
                        ${event.priority || 'medium'}
                    </span>
                </td>
                <td class="event-actions">
                    <button class="action-btn view" onclick="dashboard.viewEvent('${event.id}')">View</button>
                    <button class="action-btn edit" onclick="dashboard.editEvent('${event.id}')">Edit</button>
                    <button class="action-btn cancel" onclick="dashboard.cancelEvent('${event.id}')">Cancel</button>
                </td>
            </tr>
        `;
    }

    getEventTypeDisplay(type) {
        const types = {
            'logistics_delivery': '🚛 Delivery',
            'venue_setup': '🏢 Venue Setup',
            'equipment_transport': '📦 Equipment',
            'trade_show_support': '🏪 Trade Show',
            'emergency_service': '🚨 Emergency',
            'consultation': '💼 Consultation'
        };
        return types[type] || type;
    }

    getPriorityColor(priority) {
        const colors = {
            'low': '#dcfce7',
            'medium': '#fef3c7',
            'high': '#fed7d7',
            'urgent': '#fee2e2'
        };
        return colors[priority] || colors.medium;
    }

    generateCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthElement = document.getElementById('currentMonth');
        
        // Update month display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        currentMonthElement.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Generate calendar days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `
                <div class="calendar-day" style="background: #f1f5f9; font-weight: 700; text-align: center; padding: 0.5rem;">
                    ${day}
                </div>
            `;
        });
        
        // Generate calendar days
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
                const isToday = this.isToday(currentDate);
                const dateString = currentDate.toISOString().split('T')[0];
                
                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                
                calendarHTML += `
                    <div class="${dayClass}" data-date="${dateString}" onclick="dashboard.selectCalendarDate('${dateString}')">
                        <div class="calendar-day-number" style="${!isCurrentMonth ? 'color: #cbd5e1;' : ''}">${currentDate.getDate()}</div>
                        <div class="calendar-events" id="events-${dateString}">
                            ${this.getCalendarEventsHTML(dateString)}
                        </div>
                    </div>
                `;
            }
        }
        
        calendarGrid.innerHTML = calendarHTML;
    }

    getCalendarEventsHTML(dateString) {
        if (!this.operationsAgent) return '';
        
        const events = this.operationsAgent.getEvents().filter(event => 
            event.schedule?.start_date === dateString
        );
        
        return events.slice(0, 3).map(event => {
            const eventClass = `calendar-event ${event.type.replace('_', '-')}`;
            return `
                <div class="${eventClass}" onclick="dashboard.viewEvent('${event.id}')" title="${event.title || event.type}">
                    ${this.truncateText(event.client?.name || event.type, 15)}
                </div>
            `;
        }).join('') + (events.length > 3 ? `<div class="calendar-event">+${events.length - 3} more</div>` : '');
    }

    updateCalendarEvents() {
        if (!this.operationsAgent) return;
        
        // Update all calendar event containers
        const eventContainers = document.querySelectorAll('[id^="events-"]');
        eventContainers.forEach(container => {
            const dateString = container.id.replace('events-', '');
            container.innerHTML = this.getCalendarEventsHTML(dateString);
        });
    }

    setupEventListeners() {
        // Search events
        document.getElementById('searchEvents').addEventListener('input', (e) => {
            this.filterEvents();
        });
        
        // Filter by status
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterEvents();
        });
        
        // Filter by type
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filterEvents();
        });
        
        // Edit event form submission
        document.getElementById('editEventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEventChanges();
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeEditModal();
            }
        });
    }

    filterEvents() {
        const searchTerm = document.getElementById('searchEvents').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        
        if (!this.operationsAgent) return;
        
        let events = this.operationsAgent.getEvents();
        
        // Apply filters
        if (searchTerm) {
            events = events.filter(event => 
                event.client?.name?.toLowerCase().includes(searchTerm) ||
                event.client?.email?.toLowerCase().includes(searchTerm) ||
                event.id.toLowerCase().includes(searchTerm) ||
                event.description?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (statusFilter) {
            events = events.filter(event => event.status === statusFilter);
        }
        
        if (typeFilter) {
            events = events.filter(event => event.type === typeFilter);
        }
        
        // Update table
        const tableBody = document.getElementById('eventsTableBody');
        if (events.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                        No events match your search criteria.
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = events.map(event => this.createEventRow(event)).join('');
        }
    }

    // Event Management Methods

    viewEvent(eventId) {
        if (!this.operationsAgent) return;
        
        const event = this.operationsAgent.getEvent(eventId);
        if (!event) {
            this.showNotification('Event not found', 'error');
            return;
        }
        
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = `Event Details - ${event.id}`;
        modalContent.innerHTML = this.generateEventDetailsHTML(event);
        
        document.getElementById('eventModal').style.display = 'block';
    }

    generateEventDetailsHTML(event) {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3 style="margin-bottom: 1rem; color: #1e293b;">Client Information</h3>
                    <p><strong>Name:</strong> ${event.client?.name || 'Not specified'}</p>
                    <p><strong>Email:</strong> ${event.client?.email || 'Not specified'}</p>
                    <p><strong>Phone:</strong> ${event.client?.phone || 'Not specified'}</p>
                    <p><strong>Company:</strong> ${event.client?.company || 'Not specified'}</p>
                    
                    <h3 style="margin: 2rem 0 1rem; color: #1e293b;">Event Details</h3>
                    <p><strong>Type:</strong> ${this.getEventTypeDisplay(event.type)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${event.status.replace('_', '-')}">${event.status}</span></p>
                    <p><strong>Priority:</strong> ${event.priority || 'Medium'}</p>
                    <p><strong>Created:</strong> ${new Date(event.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                    <h3 style="margin-bottom: 1rem; color: #1e293b;">Schedule & Location</h3>
                    <p><strong>Start Date:</strong> ${event.schedule?.start_date ? new Date(event.schedule.start_date).toLocaleDateString() : 'Not set'}</p>
                    <p><strong>Start Time:</strong> ${event.schedule?.start_time || 'Not set'}</p>
                    <p><strong>Location:</strong> ${event.locations?.primary || 'Not specified'}</p>
                    
                    <h3 style="margin: 2rem 0 1rem; color: #1e293b;">Financial Information</h3>
                    <p><strong>Estimated Cost:</strong> $${event.quote?.estimated_cost || 'Not quoted'}</p>
                    <p><strong>Final Cost:</strong> $${event.quote?.final_cost || 'Pending'}</p>
                    <p><strong>Status:</strong> ${event.quote?.approved_at ? 'Approved' : 'Pending approval'}</p>
                </div>
            </div>
            
            ${event.description ? `
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: #1e293b;">Description</h3>
                    <p style="background: #f8fafc; padding: 1rem; border-radius: 6px; border-left: 4px solid #2563eb;">
                        ${event.description}
                    </p>
                </div>
            ` : ''}
            
            ${event.special_requirements?.length ? `
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: #1e293b;">Special Requirements</h3>
                    <ul style="background: #f8fafc; padding: 1rem; border-radius: 6px;">
                        ${event.special_requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${event.communications?.length ? `
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: #1e293b;">Communication Log</h3>
                    <div style="max-height: 200px; overflow-y: auto; background: #f8fafc; padding: 1rem; border-radius: 6px;">
                        ${event.communications.slice(-5).map(comm => `
                            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-size: 0.9rem; color: #6b7280;">${new Date(comm.timestamp).toLocaleString()}</div>
                                <div>${comm.message}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    editEvent(eventId) {
        if (!this.operationsAgent) return;
        
        const event = this.operationsAgent.getEvent(eventId);
        if (!event) {
            this.showNotification('Event not found', 'error');
            return;
        }
        
        this.currentEditingEvent = event;
        
        // Populate form fields
        document.getElementById('editEventType').value = event.type;
        document.getElementById('editClientName').value = event.client?.name || '';
        document.getElementById('editClientEmail').value = event.client?.email || '';
        document.getElementById('editStartDate').value = event.schedule?.start_date || '';
        document.getElementById('editStartTime').value = event.schedule?.start_time || '';
        document.getElementById('editLocation').value = event.locations?.primary || '';
        document.getElementById('editStatus').value = event.status;
        document.getElementById('editPriority').value = event.priority || 'medium';
        document.getElementById('editDescription').value = event.description || '';
        
        document.getElementById('editEventModal').style.display = 'block';
    }

    async saveEventChanges() {
        if (!this.currentEditingEvent || !this.operationsAgent) return;
        
        try {
            const formData = {
                type: document.getElementById('editEventType').value,
                client: {
                    name: document.getElementById('editClientName').value,
                    email: document.getElementById('editClientEmail').value
                },
                schedule: {
                    start_date: document.getElementById('editStartDate').value,
                    start_time: document.getElementById('editStartTime').value
                },
                locations: {
                    primary: document.getElementById('editLocation').value
                },
                status: document.getElementById('editStatus').value,
                priority: document.getElementById('editPriority').value,
                description: document.getElementById('editDescription').value
            };
            
            await this.operationsAgent.updateEvent(this.currentEditingEvent.id, formData);
            
            this.showNotification('Event updated successfully', 'success');
            this.closeEditModal();
            this.loadDashboardData(); // Refresh data
            
        } catch (error) {
            console.error('Error updating event:', error);
            this.showNotification('Failed to update event', 'error');
        }
    }

    async cancelEvent(eventId) {
        if (!this.operationsAgent) return;
        
        const reason = prompt('Please provide a reason for cancellation:');
        if (reason === null) return; // User cancelled
        
        try {
            await this.operationsAgent.cancelEvent(eventId, reason);
            this.showNotification('Event cancelled successfully', 'success');
            this.loadDashboardData(); // Refresh data
        } catch (error) {
            console.error('Error cancelling event:', error);
            this.showNotification('Failed to cancel event', 'error');
        }
    }

    // Calendar Navigation

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.generateCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.generateCalendar();
    }

    selectCalendarDate(dateString) {
        if (!this.operationsAgent) return;
        
        const events = this.operationsAgent.getEvents().filter(event => 
            event.schedule?.start_date === dateString
        );
        
        if (events.length === 0) {
            // Create new event for this date
            if (confirm(`No events on ${new Date(dateString).toLocaleDateString()}. Create a new event?`)) {
                this.createNewEvent(dateString);
            }
        } else {
            // Show events for this date
            this.showDayEvents(dateString, events);
        }
    }

    showDayEvents(dateString, events) {
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = `Events for ${new Date(dateString).toLocaleDateString()}`;
        modalContent.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                ${events.map(event => `
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #2563eb;">
                        <div style="display: flex; justify-content: between; align-items: center;">
                            <div>
                                <h4>${event.client?.name || 'Unknown Client'}</h4>
                                <p style="color: #6b7280; margin: 0.5rem 0;">${this.getEventTypeDisplay(event.type)}</p>
                                <p style="margin: 0;"><span class="status-badge status-${event.status.replace('_', '-')}">${event.status}</span></p>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="action-btn view" onclick="dashboard.viewEvent('${event.id}')">View</button>
                                <button class="action-btn edit" onclick="dashboard.editEvent('${event.id}')">Edit</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('eventModal').style.display = 'block';
    }

    // Utility Methods

    createNewEvent(startDate = null) {
        // Redirect to chatbot or create event form
        // For now, we'll show an alert
        alert('Feature coming soon! Use the chatbot to create new events by saying "I need to schedule a delivery" or similar.');
    }

    async exportEvents() {
        if (!this.operationsAgent) return;
        
        try {
            const events = this.operationsAgent.getEvents();
            const csvContent = this.convertEventsToCSV(events);
            this.downloadCSV(csvContent, `quiet-craft-events-${new Date().toISOString().split('T')[0]}.csv`);
            this.showNotification('Events exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting events:', error);
            this.showNotification('Failed to export events', 'error');
        }
    }

    convertEventsToCSV(events) {
        const headers = [
            'Event ID', 'Client Name', 'Client Email', 'Type', 'Status', 'Priority',
            'Start Date', 'Start Time', 'Location', 'Description', 'Created Date'
        ];
        
        const rows = events.map(event => [
            event.id,
            event.client?.name || '',
            event.client?.email || '',
            event.type,
            event.status,
            event.priority || '',
            event.schedule?.start_date || '',
            event.schedule?.start_time || '',
            event.locations?.primary || '',
            event.description || '',
            new Date(event.created_at).toLocaleDateString()
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async syncCalendar() {
        this.showNotification('Calendar sync feature coming soon!', 'info');
    }

    closeModal() {
        document.getElementById('eventModal').style.display = 'none';
    }

    closeEditModal() {
        document.getElementById('editEventModal').style.display = 'none';
        this.currentEditingEvent = null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease;
        `;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    startAutoRefresh() {
        // Refresh dashboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateStatistics();
            this.updateCalendarEvents();
        }, 30000);
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

// Global functions for HTML onclick handlers
let dashboard;

function createNewEvent() {
    dashboard.createNewEvent();
}

function exportEvents() {
    dashboard.exportEvents();
}

function syncCalendar() {
    dashboard.syncCalendar();
}

function previousMonth() {
    dashboard.previousMonth();
}

function nextMonth() {
    dashboard.nextMonth();
}

function closeModal() {
    dashboard.closeModal();
}

function closeEditModal() {
    dashboard.closeEditModal();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new OperationsDashboard();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .today {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe) !important;
        border: 2px solid #2563eb !important;
    }
    
    .other-month {
        opacity: 0.4;
    }
`;
document.head.appendChild(style);
