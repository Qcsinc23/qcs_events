/**
 * Notification Service - Advanced notification and integration system
 * Handles email, SMS, calendar sync, and real-time notifications
 */

class NotificationService {
    constructor() {
        this.config = this.loadConfig();
        this.notificationQueue = [];
        this.subscriptions = new Map();
        this.isOnline = navigator.onLine;
        this.retryAttempts = 3;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startQueueProcessor();
        this.initializeWebPush();
    }

    loadConfig() {
        const saved = localStorage.getItem('notification_config');
        return saved ? JSON.parse(saved) : {
            email: {
                enabled: true,
                apiKey: '',
                fromEmail: 'operations@quietcrafting.com',
                fromName: 'Quiet Craft Solutions Operations'
            },
            sms: {
                enabled: false,
                apiKey: '',
                fromNumber: '+15551234567'
            },
            calendar: {
                enabled: true,
                googleCalendarId: '',
                outlookEnabled: false
            },
            realTime: {
                enabled: true,
                pushNotifications: true,
                soundEnabled: true
            },
            templates: this.getDefaultTemplates()
        };
    }

    saveConfig() {
        localStorage.setItem('notification_config', JSON.stringify(this.config));
    }

    getDefaultTemplates() {
        return {
            event_created: {
                email: {
                    subject: 'Event Booking Confirmation - {eventId}',
                    body: `
                        <h2>Event Booking Confirmation</h2>
                        <p>Dear {clientName},</p>
                        <p>Thank you for choosing Quiet Craft Solutions! Your event has been successfully created.</p>
                        
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <h3>Event Details:</h3>
                            <p><strong>Event ID:</strong> {eventId}</p>
                            <p><strong>Service Type:</strong> {eventType}</p>
                            <p><strong>Date:</strong> {startDate}</p>
                            <p><strong>Time:</strong> {startTime}</p>
                            <p><strong>Location:</strong> {location}</p>
                        </div>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Our team will review your requirements</li>
                            <li>You'll receive a detailed quote within 2 hours</li>
                            <li>A dedicated coordinator will be assigned to your event</li>
                        </ul>
                        
                        <p>If you have any questions, please don't hesitate to contact us at (973) 415-9532.</p>
                        
                        <p>Best regards,<br>
                        The Quiet Craft Solutions Team</p>
                    `
                },
                sms: 'Hi {clientName}! Your event booking {eventId} has been confirmed for {startDate}. We\'ll send you a detailed quote soon. Questions? Call (973) 415-9532.'
            },
            event_updated: {
                email: {
                    subject: 'Event Update - {eventId}',
                    body: `
                        <h2>Event Update Notification</h2>
                        <p>Dear {clientName},</p>
                        <p>Your event <strong>{eventId}</strong> has been updated.</p>
                        
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <h3>Updated Details:</h3>
                            <p><strong>Status:</strong> {status}</p>
                            <p><strong>Date:</strong> {startDate}</p>
                            <p><strong>Time:</strong> {startTime}</p>
                            <p><strong>Location:</strong> {location}</p>
                        </div>
                        
                        <p>If you have any questions about this update, please contact your coordinator or call (973) 415-9532.</p>
                        
                        <p>Best regards,<br>
                        The Quiet Craft Solutions Team</p>
                    `
                },
                sms: 'Event Update: Your booking {eventId} has been updated. New status: {status}. Check your email for details or call (973) 415-9532.'
            },
            event_cancelled: {
                email: {
                    subject: 'Event Cancellation - {eventId}',
                    body: `
                        <h2>Event Cancellation Notice</h2>
                        <p>Dear {clientName},</p>
                        <p>We regret to inform you that your event <strong>{eventId}</strong> has been cancelled.</p>
                        
                        <div style="background: #fee2e2; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <h3>Cancellation Details:</h3>
                            <p><strong>Reason:</strong> {cancellationReason}</p>
                            <p><strong>Cancelled Date:</strong> {cancelledAt}</p>
                        </div>
                        
                        <p>If this cancellation was unexpected or if you'd like to reschedule, please contact us immediately at (973) 415-9532.</p>
                        
                        <p>We apologize for any inconvenience and look forward to serving you in the future.</p>
                        
                        <p>Best regards,<br>
                        The Quiet Craft Solutions Team</p>
                    `
                },
                sms: 'CANCELLED: Your event {eventId} has been cancelled. Reason: {cancellationReason}. Please call (973) 415-9532 for assistance.'
            },
            quote_ready: {
                email: {
                    subject: 'Quote Ready - {eventId}',
                    body: `
                        <h2>Your Quote is Ready!</h2>
                        <p>Dear {clientName},</p>
                        <p>We've prepared a detailed quote for your event <strong>{eventId}</strong>.</p>
                        
                        <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <h3>Quote Summary:</h3>
                            <p><strong>Service:</strong> {eventType}</p>
                            <p><strong>Total Cost:</strong> ${estimatedCost}</p>
                            <p><strong>Valid Until:</strong> {quoteValidUntil}</p>
                        </div>
                        
                        <p>To accept this quote and proceed with your booking, please reply to this email or call us at (973) 415-9532.</p>
                        
                        <p>We look forward to serving you!</p>
                        
                        <p>Best regards,<br>
                        The Quiet Craft Solutions Team</p>
                    `
                },
                sms: 'Quote ready for {eventId}! Total: ${estimatedCost}. To accept, call (973) 415-9532 or check your email.'
            },
            reminder_24h: {
                email: {
                    subject: 'Event Reminder - Tomorrow - {eventId}',
                    body: `
                        <h2>Event Reminder - Tomorrow</h2>
                        <p>Dear {clientName},</p>
                        <p>This is a friendly reminder that your event is scheduled for <strong>tomorrow</strong>.</p>
                        
                        <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <h3>Event Details:</h3>
                            <p><strong>Service:</strong> {eventType}</p>
                            <p><strong>Date:</strong> {startDate}</p>
                            <p><strong>Time:</strong> {startTime}</p>
                            <p><strong>Location:</strong> {location}</p>
                            <p><strong>Coordinator:</strong> {coordinatorName} - {coordinatorPhone}</p>
                        </div>
                        
                        <p><strong>Preparation Checklist:</strong></p>
                        <ul>
                            <li>Ensure clear access to pickup/delivery locations</li>
                            <li>Have all required documentation ready</li>
                            <li>Confirm contact person will be available</li>
                        </ul>
                        
                        <p>If you need to make any last-minute changes, please call us at (973) 415-9532.</p>
                        
                        <p>Best regards,<br>
                        The Quiet Craft Solutions Team</p>
                    `
                },
                sms: 'Reminder: Your event {eventId} is tomorrow at {startTime}. Location: {location}. Coordinator: {coordinatorName} {coordinatorPhone}. Questions? (973) 415-9532'
            }
        };
    }

    // Core Notification Methods

    async sendNotification(type, eventData, options = {}) {
        const notification = {
            id: this.generateNotificationId(),
            type,
            eventData,
            options,
            timestamp: new Date().toISOString(),
            status: 'pending',
            attempts: 0
        };

        this.notificationQueue.push(notification);
        
        if (this.isOnline) {
            await this.processNotification(notification);
        }

        return notification.id;
    }

    async processNotification(notification) {
        try {
            notification.status = 'processing';
            notification.attempts++;

            const template = this.config.templates[notification.type];
            if (!template) {
                throw new Error(`No template found for notification type: ${notification.type}`);
            }

            const promises = [];

            // Send email notification
            if (this.config.email.enabled && notification.eventData.client?.email) {
                promises.push(this.sendEmailNotification(notification, template.email));
            }

            // Send SMS notification
            if (this.config.sms.enabled && notification.eventData.client?.phone) {
                promises.push(this.sendSMSNotification(notification, template.sms));
            }

            // Send push notification
            if (this.config.realTime.enabled && this.config.realTime.pushNotifications) {
                promises.push(this.sendPushNotification(notification));
            }

            // Create calendar event
            if (this.config.calendar.enabled && notification.type === 'event_created') {
                promises.push(this.createCalendarEvent(notification.eventData));
            }

            await Promise.allSettled(promises);
            
            notification.status = 'sent';
            notification.sentAt = new Date().toISOString();

        } catch (error) {
            console.error('Notification processing error:', error);
            notification.status = 'failed';
            notification.error = error.message;

            // Retry logic
            if (notification.attempts < this.retryAttempts) {
                setTimeout(() => {
                    this.processNotification(notification);
                }, 5000 * notification.attempts); // Exponential backoff
            }
        }
    }

    async sendEmailNotification(notification, template) {
        // In production, this would integrate with services like SendGrid, Mailgun, etc.
        // For now, we'll simulate the email sending
        
        const emailData = {
            to: notification.eventData.client.email,
            from: {
                email: this.config.email.fromEmail,
                name: this.config.email.fromName
            },
            subject: this.interpolateTemplate(template.subject, notification.eventData),
            html: this.interpolateTemplate(template.body, notification.eventData)
        };

        // Simulate API call
        console.log('Sending email:', emailData);
        
        // Store email in local storage for demonstration
        this.storeNotificationRecord('email', emailData, notification);
        
        return { success: true, provider: 'email' };
    }

    async sendSMSNotification(notification, template) {
        // In production, this would integrate with services like Twilio, AWS SNS, etc.
        
        const smsData = {
            to: notification.eventData.client.phone,
            from: this.config.sms.fromNumber,
            body: this.interpolateTemplate(template, notification.eventData)
        };

        // Simulate API call
        console.log('Sending SMS:', smsData);
        
        // Store SMS in local storage for demonstration
        this.storeNotificationRecord('sms', smsData, notification);
        
        return { success: true, provider: 'sms' };
    }

    async sendPushNotification(notification) {
        if ('Notification' in window) {
            // Request permission if needed
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }

            if (Notification.permission === 'granted') {
                const notificationOptions = {
                    body: this.getPushNotificationMessage(notification),
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: notification.eventData.id,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'view',
                            title: 'View Details'
                        },
                        {
                            action: 'dismiss',
                            title: 'Dismiss'
                        }
                    ]
                };

                const pushNotification = new Notification(
                    `Event ${notification.type.replace('_', ' ')}`,
                    notificationOptions
                );

                pushNotification.onclick = () => {
                    // Open operations dashboard
                    window.open('/chatbot/operations-dashboard.html', '_blank');
                    pushNotification.close();
                };

                // Play sound if enabled
                if (this.config.realTime.soundEnabled) {
                    this.playNotificationSound();
                }
            }
        }

        return { success: true, provider: 'push' };
    }

    async createCalendarEvent(eventData) {
        const calendarEvent = {
            id: eventData.id,
            title: `${eventData.client?.name || 'Client'} - ${this.getEventTypeDisplay(eventData.type)}`,
            start: `${eventData.schedule?.start_date}T${eventData.schedule?.start_time || '09:00'}`,
            end: `${eventData.schedule?.start_date}T${eventData.schedule?.end_time || '17:00'}`,
            description: eventData.description || '',
            location: eventData.locations?.primary || '',
            attendees: [
                {
                    email: eventData.client?.email,
                    name: eventData.client?.name,
                    status: 'needsAction'
                }
            ]
        };

        // Store calendar event for potential sync
        this.storeCalendarEvent(calendarEvent);
        
        // Generate calendar file for download
        const icsContent = this.generateICSFile(calendarEvent);
        
        return { success: true, provider: 'calendar', icsContent };
    }

    // Template and Utility Methods

    interpolateTemplate(template, data) {
        if (!template || !data) return template;

        return template.replace(/\{(\w+)\}/g, (match, key) => {
            // Handle nested properties
            const keys = key.split('.');
            let value = data;
            
            for (const k of keys) {
                value = value?.[k];
            }

            // Format specific fields
            if (key === 'startDate' && value) {
                return new Date(value).toLocaleDateString();
            }
            if (key === 'startTime' && value) {
                return value;
            }
            if (key === 'eventType' && value) {
                return this.getEventTypeDisplay(value);
            }
            if (key === 'cancelledAt' && value) {
                return new Date(value).toLocaleString();
            }

            return value || '';
        });
    }

    getEventTypeDisplay(type) {
        const types = {
            'logistics_delivery': 'Logistics Delivery',
            'venue_setup': 'Venue Setup',
            'equipment_transport': 'Equipment Transport',
            'trade_show_support': 'Trade Show Support',
            'emergency_service': 'Emergency Service',
            'consultation': 'Consultation Meeting'
        };
        return types[type] || type;
    }

    getPushNotificationMessage(notification) {
        const messages = {
            'event_created': `New event ${notification.eventData.id} created for ${notification.eventData.client?.name}`,
            'event_updated': `Event ${notification.eventData.id} has been updated`,
            'event_cancelled': `Event ${notification.eventData.id} has been cancelled`,
            'quote_ready': `Quote ready for event ${notification.eventData.id}`,
            'reminder_24h': `Event ${notification.eventData.id} is tomorrow`
        };
        
        return messages[notification.type] || `Event notification: ${notification.type}`;
    }

    generateICSFile(calendarEvent) {
        const formatDate = (date) => {
            return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Quiet Craft Solutions//Event Management//EN
BEGIN:VEVENT
UID:${calendarEvent.id}@quietcrafting.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(calendarEvent.start)}
DTEND:${formatDate(calendarEvent.end)}
SUMMARY:${calendarEvent.title}
DESCRIPTION:${calendarEvent.description}
LOCATION:${calendarEvent.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    }

    // Storage and Management

    storeNotificationRecord(type, data, notification) {
        const records = this.getNotificationHistory();
        records.push({
            id: notification.id,
            type,
            data,
            timestamp: new Date().toISOString(),
            eventId: notification.eventData.id
        });
        
        // Keep only last 100 records
        if (records.length > 100) {
            records.splice(0, records.length - 100);
        }
        
        localStorage.setItem('notification_history', JSON.stringify(records));
    }

    storeCalendarEvent(event) {
        const events = this.getStoredCalendarEvents();
        events.push(event);
        localStorage.setItem('calendar_events', JSON.stringify(events));
    }

    getNotificationHistory() {
        const saved = localStorage.getItem('notification_history');
        return saved ? JSON.parse(saved) : [];
    }

    getStoredCalendarEvents() {
        const saved = localStorage.getItem('calendar_events');
        return saved ? JSON.parse(saved) : [];
    }

    // Automated Reminder System

    setupAutomatedReminders() {
        // Check for upcoming events every hour
        setInterval(() => {
            this.checkForReminders();
        }, 60 * 60 * 1000);
    }

    async checkForReminders() {
        const events = JSON.parse(localStorage.getItem('operations_agent_events') || '[]');
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        for (const event of events) {
            if (event.status === 'confirmed' && event.schedule?.start_date) {
                const eventDate = new Date(event.schedule.start_date);
                
                // Send 24-hour reminder
                if (this.isSameDay(eventDate, tomorrow) && !event.reminder_24h_sent) {
                    await this.sendNotification('reminder_24h', event);
                    event.reminder_24h_sent = true;
                    this.updateEventInStorage(event);
                }
            }
        }
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    updateEventInStorage(updatedEvent) {
        const events = JSON.parse(localStorage.getItem('operations_agent_events') || '[]');
        const index = events.findIndex(e => e.id === updatedEvent.id);
        if (index !== -1) {
            events[index] = updatedEvent;
            localStorage.setItem('operations_agent_events', JSON.stringify(events));
        }
    }

    // Event Listeners and Queue Processing

    setupEventListeners() {
        // Listen for online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processQueuedNotifications();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Listen for event updates
        window.addEventListener('eventCreated', (e) => {
            this.sendNotification('event_created', e.detail);
        });

        window.addEventListener('eventUpdated', (e) => {
            this.sendNotification('event_updated', e.detail);
        });

        window.addEventListener('eventCancelled', (e) => {
            this.sendNotification('event_cancelled', e.detail);
        });
    }

    startQueueProcessor() {
        // Process queued notifications every 10 seconds
        setInterval(() => {
            if (this.isOnline) {
                this.processQueuedNotifications();
            }
        }, 10000);
    }

    async processQueuedNotifications() {
        const pendingNotifications = this.notificationQueue.filter(n => 
            n.status === 'pending' && n.attempts < this.retryAttempts
        );

        for (const notification of pendingNotifications) {
            await this.processNotification(notification);
        }
    }

    // Web Push Setup

    initializeWebPush() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }

    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDuU2e/ReSMFl4Xg9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTY37l9N2QQgQTZIHk9NmRQgQTZIHg');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore autoplay policy errors
            });
        } catch (error) {
            // Ignore sound errors
        }
    }

    // Utility Methods

    generateNotificationId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
} else {
    window.NotificationService = NotificationService;
}
