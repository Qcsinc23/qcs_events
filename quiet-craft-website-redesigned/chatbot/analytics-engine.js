/**
 * Analytics Engine - Advanced analytics and reporting system
 * Provides comprehensive insights into operations, customer behavior, and business performance
 */

class AnalyticsEngine {
    constructor() {
        this.analyticsData = this.loadAnalyticsData();
        this.reportingConfig = this.loadReportingConfig();
        this.kpis = new Map();
        this.trends = new Map();
        this.predictions = new Map();
        
        this.init();
    }

    init() {
        this.setupDataCollection();
        this.calculateKPIs();
        this.analyzeTrends();
        this.startRealTimeMonitoring();
    }

    loadAnalyticsData() {
        const saved = localStorage.getItem('operations_analytics_data');
        return saved ? JSON.parse(saved) : {
            events: [],
            conversations: [],
            performance: [],
            customers: [],
            revenue: [],
            operational: [],
            satisfaction: [],
            efficiency: []
        };
    }

    loadReportingConfig() {
        const saved = localStorage.getItem('analytics_reporting_config');
        return saved ? JSON.parse(saved) : {
            refreshInterval: 60000, // 1 minute
            retentionDays: 90,
            alertThresholds: {
                cancellationRate: 0.15,
                responseTime: 2.0,
                satisfactionScore: 4.0,
                revenueGrowth: -0.1
            },
            customMetrics: [],
            reportSchedule: {
                daily: true,
                weekly: true,
                monthly: true
            }
        };
    }

    saveAnalyticsData() {
        localStorage.setItem('operations_analytics_data', JSON.stringify(this.analyticsData));
    }

    // Data Collection and Processing

    collectEventData(event, action = 'created') {
        const eventMetric = {
            id: event.id,
            type: event.type,
            action: action,
            timestamp: new Date().toISOString(),
            clientId: this.generateClientId(event.client),
            value: event.quote?.estimated_cost || 0,
            status: event.status,
            priority: event.priority,
            location: event.locations?.primary,
            duration: this.calculateEventDuration(event),
            responseTime: this.calculateResponseTime(event),
            satisfaction: event.satisfaction || null,
            metadata: {
                source: 'chatbot',
                conversationId: event.conversationId,
                leadCaptured: event.leadCaptured || false,
                specialRequirements: event.special_requirements?.length || 0
            }
        };

        this.analyticsData.events.push(eventMetric);
        this.saveAnalyticsData();
        this.updateRealTimeMetrics(eventMetric);
    }

    collectConversationData(conversation) {
        const conversationMetric = {
            id: conversation.id,
            timestamp: conversation.timestamp,
            duration: conversation.duration,
            messageCount: conversation.messageCount,
            operationsEngaged: conversation.operationsEngaged,
            leadCaptured: conversation.leadCaptured,
            eventCreated: conversation.eventCreated,
            satisfaction: conversation.satisfaction,
            exitPoint: conversation.exitPoint,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            sessionId: conversation.sessionId
        };

        this.analyticsData.conversations.push(conversationMetric);
        this.saveAnalyticsData();
    }

    collectPerformanceData() {
        const performanceMetric = {
            timestamp: new Date().toISOString(),
            loadTime: performance.now(),
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null,
            connectionType: navigator.connection?.effectiveType || 'unknown',
            systemMetrics: {
                eventsProcessed: this.analyticsData.events.length,
                conversationsHandled: this.analyticsData.conversations.length,
                notificationsSent: this.getNotificationCount(),
                errorRate: this.calculateErrorRate()
            }
        };

        this.analyticsData.performance.push(performanceMetric);
        this.saveAnalyticsData();
    }

    // KPI Calculations

    calculateKPIs() {
        const now = new Date();
        const timeframes = {
            today: this.getDataSince(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
            week: this.getDataSince(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
            month: this.getDataSince(new Date(now.getFullYear(), now.getMonth(), 1)),
            quarter: this.getDataSince(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1))
        };

        Object.keys(timeframes).forEach(period => {
            this.kpis.set(period, this.calculateKPIsForPeriod(timeframes[period]));
        });
    }

    calculateKPIsForPeriod(data) {
        const events = data.events || [];
        const conversations = data.conversations || [];

        return {
            // Volume Metrics
            totalEvents: events.length,
            totalConversations: conversations.length,
            eventsPerDay: events.length / this.getDaysDifference(data.startDate, data.endDate),
            
            // Conversion Metrics
            conversionRate: conversations.length > 0 ? events.length / conversations.length : 0,
            leadCaptureRate: conversations.length > 0 ? 
                conversations.filter(c => c.leadCaptured).length / conversations.length : 0,
            operationsEngagementRate: conversations.length > 0 ?
                conversations.filter(c => c.operationsEngaged).length / conversations.length : 0,

            // Financial Metrics
            totalRevenue: events.reduce((sum, e) => sum + (e.value || 0), 0),
            averageOrderValue: events.length > 0 ? 
                events.reduce((sum, e) => sum + (e.value || 0), 0) / events.length : 0,
            revenuePerConversation: conversations.length > 0 ?
                events.reduce((sum, e) => sum + (e.value || 0), 0) / conversations.length : 0,

            // Quality Metrics
            averageResponseTime: this.calculateAverageResponseTime(events),
            customerSatisfaction: this.calculateAverageSatisfaction(events),
            cancellationRate: events.length > 0 ?
                events.filter(e => e.status === 'cancelled').length / events.length : 0,
            completionRate: events.length > 0 ?
                events.filter(e => e.status === 'completed').length / events.length : 0,

            // Operational Metrics
            eventTypeDistribution: this.calculateEventTypeDistribution(events),
            priorityDistribution: this.calculatePriorityDistribution(events),
            averageEventDuration: this.calculateAverageEventDuration(events),
            resourceUtilization: this.calculateResourceUtilization(events),

            // Customer Metrics
            newCustomers: this.calculateNewCustomers(conversations),
            returningCustomers: this.calculateReturningCustomers(conversations),
            customerLifetimeValue: this.calculateCustomerLifetimeValue(events),

            // Efficiency Metrics
            automationRate: conversations.length > 0 ?
                conversations.filter(c => !c.humanHandoff).length / conversations.length : 0,
            firstResponseTime: this.calculateFirstResponseTime(conversations),
            resolutionTime: this.calculateResolutionTime(events)
        };
    }

    // Trend Analysis

    analyzeTrends() {
        const timeframes = ['week', 'month', 'quarter'];
        
        timeframes.forEach(timeframe => {
            this.trends.set(timeframe, this.calculateTrendsForTimeframe(timeframe));
        });
    }

    calculateTrendsForTimeframe(timeframe) {
        const historicalData = this.getHistoricalData(timeframe);
        
        return {
            revenue: this.calculateTrend(historicalData.map(d => d.totalRevenue)),
            events: this.calculateTrend(historicalData.map(d => d.totalEvents)),
            conversations: this.calculateTrend(historicalData.map(d => d.totalConversations)),
            satisfaction: this.calculateTrend(historicalData.map(d => d.customerSatisfaction)),
            conversionRate: this.calculateTrend(historicalData.map(d => d.conversionRate)),
            responseTime: this.calculateTrend(historicalData.map(d => d.averageResponseTime)),
            cancellationRate: this.calculateTrend(historicalData.map(d => d.cancellationRate))
        };
    }

    calculateTrend(values) {
        if (values.length < 2) return { direction: 'stable', change: 0, confidence: 0 };

        const recent = values.slice(-Math.min(5, values.length));
        const older = values.slice(0, -Math.min(5, values.length));

        if (older.length === 0) return { direction: 'stable', change: 0, confidence: 0 };

        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        const change = olderAvg !== 0 ? (recentAvg - olderAvg) / olderAvg : 0;
        const direction = change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable';
        const confidence = Math.min(values.length / 10, 1); // More data = higher confidence

        return { direction, change, confidence };
    }

    // Predictive Analytics

    generatePredictions() {
        const predictions = {
            revenue: this.predictRevenue(),
            events: this.predictEvents(),
            demand: this.predictDemand(),
            capacity: this.predictCapacityNeeds(),
            churn: this.predictCustomerChurn()
        };

        this.predictions.set('current', predictions);
        return predictions;
    }

    predictRevenue() {
        const historicalRevenue = this.getHistoricalRevenue();
        const trend = this.calculateTrend(historicalRevenue);
        
        const baseRevenue = historicalRevenue[historicalRevenue.length - 1] || 0;
        const predictions = [];
        
        for (let i = 1; i <= 12; i++) { // 12 months ahead
            const predicted = baseRevenue * (1 + trend.change) ** i;
            predictions.push({
                period: i,
                value: predicted,
                confidence: Math.max(0.1, trend.confidence - (i * 0.05))
            });
        }
        
        return predictions;
    }

    predictEvents() {
        const seasonality = this.calculateSeasonality();
        const trend = this.trends.get('month')?.events || { direction: 'stable', change: 0 };
        
        const currentEvents = this.kpis.get('month')?.totalEvents || 0;
        const predictions = [];
        
        for (let i = 1; i <= 6; i++) { // 6 months ahead
            const seasonalMultiplier = seasonality[i % 12] || 1;
            const trendMultiplier = 1 + (trend.change * i);
            const predicted = currentEvents * trendMultiplier * seasonalMultiplier;
            
            predictions.push({
                period: i,
                value: Math.round(predicted),
                confidence: Math.max(0.2, 1 - (i * 0.1))
            });
        }
        
        return predictions;
    }

    predictDemand() {
        const eventTypes = this.calculateEventTypeDistribution(this.analyticsData.events);
        const trends = {};
        
        Object.keys(eventTypes).forEach(type => {
            const typeEvents = this.analyticsData.events.filter(e => e.type === type);
            const monthlyData = this.groupByMonth(typeEvents);
            trends[type] = this.calculateTrend(monthlyData.map(m => m.count));
        });
        
        return trends;
    }

    predictCapacityNeeds() {
        const currentUtilization = this.kpis.get('month')?.resourceUtilization || 0;
        const eventGrowth = this.trends.get('month')?.events?.change || 0;
        
        const predictions = [];
        for (let i = 1; i <= 6; i++) {
            const projectedUtilization = currentUtilization * (1 + eventGrowth) ** i;
            const capacityNeeded = projectedUtilization > 0.8 ? 'increase' : 
                                  projectedUtilization < 0.4 ? 'decrease' : 'maintain';
            
            predictions.push({
                period: i,
                utilization: projectedUtilization,
                recommendation: capacityNeeded,
                confidence: Math.max(0.3, 1 - (i * 0.1))
            });
        }
        
        return predictions;
    }

    predictCustomerChurn() {
        const customers = this.getUniqueCustomers();
        const churnPredictions = [];
        
        customers.forEach(customer => {
            const customerEvents = this.analyticsData.events.filter(e => 
                this.generateClientId(e.client) === customer.id
            );
            
            const daysSinceLastEvent = this.getDaysSince(customer.lastEventDate);
            const eventFrequency = customer.totalEvents / customer.daysSinceFirst;
            const expectedDaysBetween = 1 / eventFrequency;
            
            const churnProbability = Math.min(1, daysSinceLastEvent / (expectedDaysBetween * 2));
            
            if (churnProbability > 0.5) {
                churnPredictions.push({
                    customerId: customer.id,
                    churnProbability,
                    daysSinceLastEvent,
                    totalValue: customer.totalValue,
                    recommendation: churnProbability > 0.8 ? 'immediate_action' : 'follow_up'
                });
            }
        });
        
        return churnPredictions.sort((a, b) => b.churnProbability - a.churnProbability);
    }

    // Report Generation

    generateDashboardReport() {
        const kpis = this.kpis.get('month') || {};
        const trends = this.trends.get('month') || {};
        const predictions = this.generatePredictions();
        
        return {
            summary: {
                totalEvents: kpis.totalEvents || 0,
                totalRevenue: kpis.totalRevenue || 0,
                conversionRate: kpis.conversionRate || 0,
                customerSatisfaction: kpis.customerSatisfaction || 0,
                growth: {
                    revenue: trends.revenue?.change || 0,
                    events: trends.events?.change || 0,
                    satisfaction: trends.satisfaction?.change || 0
                }
            },
            performance: {
                responseTime: kpis.averageResponseTime || 0,
                completionRate: kpis.completionRate || 0,
                cancellationRate: kpis.cancellationRate || 0,
                automationRate: kpis.automationRate || 0
            },
            forecasts: {
                nextMonthRevenue: predictions.revenue[0]?.value || 0,
                nextMonthEvents: predictions.events[0]?.value || 0,
                capacityRecommendation: predictions.capacity[0]?.recommendation || 'maintain'
            },
            alerts: this.generateAlerts(),
            insights: this.generateInsights()
        };
    }

    generateDetailedReport(timeframe = 'month') {
        const kpis = this.kpis.get(timeframe) || {};
        const trends = this.trends.get(timeframe) || {};
        
        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                timeframe,
                dataPoints: this.analyticsData.events.length
            },
            executiveSummary: this.generateExecutiveSummary(kpis, trends),
            operationalMetrics: {
                volume: {
                    totalEvents: kpis.totalEvents,
                    totalConversations: kpis.totalConversations,
                    eventsPerDay: kpis.eventsPerDay
                },
                quality: {
                    customerSatisfaction: kpis.customerSatisfaction,
                    responseTime: kpis.averageResponseTime,
                    completionRate: kpis.completionRate,
                    cancellationRate: kpis.cancellationRate
                },
                financial: {
                    totalRevenue: kpis.totalRevenue,
                    averageOrderValue: kpis.averageOrderValue,
                    revenuePerConversation: kpis.revenuePerConversation
                },
                efficiency: {
                    automationRate: kpis.automationRate,
                    conversionRate: kpis.conversionRate,
                    resourceUtilization: kpis.resourceUtilization
                }
            },
            trends: trends,
            breakdowns: {
                eventTypes: kpis.eventTypeDistribution,
                priorities: kpis.priorityDistribution,
                customers: this.getCustomerAnalysis()
            },
            recommendations: this.generateRecommendations(kpis, trends)
        };
    }

    generateAlerts() {
        const alerts = [];
        const kpis = this.kpis.get('today') || {};
        const thresholds = this.reportingConfig.alertThresholds;
        
        if (kpis.cancellationRate > thresholds.cancellationRate) {
            alerts.push({
                type: 'warning',
                metric: 'cancellationRate',
                value: kpis.cancellationRate,
                threshold: thresholds.cancellationRate,
                message: 'High cancellation rate detected'
            });
        }
        
        if (kpis.averageResponseTime > thresholds.responseTime) {
            alerts.push({
                type: 'warning',
                metric: 'responseTime',
                value: kpis.averageResponseTime,
                threshold: thresholds.responseTime,
                message: 'Response times are above target'
            });
        }
        
        if (kpis.customerSatisfaction < thresholds.satisfactionScore) {
            alerts.push({
                type: 'critical',
                metric: 'satisfaction',
                value: kpis.customerSatisfaction,
                threshold: thresholds.satisfactionScore,
                message: 'Customer satisfaction below target'
            });
        }
        
        return alerts;
    }

    generateInsights() {
        const insights = [];
        const monthlyKPIs = this.kpis.get('month') || {};
        const trends = this.trends.get('month') || {};
        
        // Revenue insights
        if (trends.revenue?.direction === 'increasing') {
            insights.push({
                type: 'positive',
                category: 'revenue',
                message: `Revenue is trending upward with ${(trends.revenue.change * 100).toFixed(1)}% growth`,
                impact: 'high'
            });
        }
        
        // Efficiency insights
        if (monthlyKPIs.automationRate > 0.8) {
            insights.push({
                type: 'positive',
                category: 'efficiency',
                message: `High automation rate of ${(monthlyKPIs.automationRate * 100).toFixed(1)}% indicates effective chatbot performance`,
                impact: 'medium'
            });
        }
        
        // Customer insights
        if (monthlyKPIs.conversionRate > 0.3) {
            insights.push({
                type: 'positive',
                category: 'conversion',
                message: `Strong conversion rate of ${(monthlyKPIs.conversionRate * 100).toFixed(1)}% shows effective lead qualification`,
                impact: 'high'
            });
        }
        
        return insights;
    }

    // Utility Methods

    generateClientId(client) {
        if (!client) return 'anonymous';
        return btoa(`${client.email || client.phone || client.name || 'unknown'}`).substring(0, 10);
    }

    calculateEventDuration(event) {
        if (!event.schedule?.start_date || !event.schedule?.end_date) return null;
        const start = new Date(event.schedule.start_date);
        const end = new Date(event.schedule.end_date);
        return (end - start) / (1000 * 60 * 60); // hours
    }

    calculateResponseTime(event) {
        if (!event.communications || event.communications.length < 2) return null;
        const first = new Date(event.communications[0].timestamp);
        const response = new Date(event.communications[1].timestamp);
        return (response - first) / (1000 * 60); // minutes
    }

    getDaysDifference(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    }

    getDaysSince(date) {
        const now = new Date();
        const past = new Date(date);
        return Math.ceil((now - past) / (1000 * 60 * 60 * 24));
    }

    getDataSince(sinceDate) {
        const events = this.analyticsData.events.filter(e => 
            new Date(e.timestamp) >= sinceDate
        );
        const conversations = this.analyticsData.conversations.filter(c => 
            new Date(c.timestamp) >= sinceDate
        );
        
        return {
            events,
            conversations,
            startDate: sinceDate,
            endDate: new Date()
        };
    }

    startRealTimeMonitoring() {
        // Update analytics every minute
        setInterval(() => {
            this.collectPerformanceData();
            this.calculateKPIs();
            this.analyzeTrends();
        }, this.reportingConfig.refreshInterval);
    }

    // Additional helper methods for calculations...
    calculateAverageResponseTime(events) {
        const responseTimes = events.map(e => e.responseTime).filter(rt => rt !== null);
        return responseTimes.length > 0 ? 
            responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
    }

    calculateAverageSatisfaction(events) {
        const satisfactionScores = events.map(e => e.satisfaction).filter(s => s !== null);
        return satisfactionScores.length > 0 ?
            satisfactionScores.reduce((sum, s) => sum + s, 0) / satisfactionScores.length : 0;
    }

    calculateEventTypeDistribution(events) {
        const distribution = {};
        events.forEach(event => {
            distribution[event.type] = (distribution[event.type] || 0) + 1;
        });
        return distribution;
    }

    calculatePriorityDistribution(events) {
        const distribution = {};
        events.forEach(event => {
            distribution[event.priority || 'medium'] = (distribution[event.priority || 'medium'] || 0) + 1;
        });
        return distribution;
    }

    calculateSeasonality() {
        // Simple seasonality calculation based on historical data
        const monthlyData = new Array(12).fill(1);
        // This would be enhanced with actual seasonal patterns
        return monthlyData;
    }

    getUniqueCustomers() {
        const customers = new Map();
        
        this.analyticsData.events.forEach(event => {
            const clientId = this.generateClientId(event.client);
            if (!customers.has(clientId)) {
                customers.set(clientId, {
                    id: clientId,
                    firstEventDate: event.timestamp,
                    lastEventDate: event.timestamp,
                    totalEvents: 0,
                    totalValue: 0
                });
            }
            
            const customer = customers.get(clientId);
            customer.totalEvents++;
            customer.totalValue += event.value || 0;
            customer.lastEventDate = event.timestamp;
            customer.daysSinceFirst = this.getDaysSince(customer.firstEventDate);
        });
        
        return Array.from(customers.values());
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsEngine;
} else {
    window.AnalyticsEngine = AnalyticsEngine;
}
