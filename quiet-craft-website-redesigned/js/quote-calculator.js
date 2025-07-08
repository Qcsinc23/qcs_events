class QuoteCalculator {
    constructor(pricing) {
        this.pricing = pricing;
    }

    calculateQuote(formData) {
        // Validate pricing object exists
        if (!this.pricing) {
            throw new Error('Pricing configuration not available. Please try again later.');
        }

        // Validate required pricing properties
        const requiredFields = ['baseFee', 'distanceSurcharge', 'itemHandling', 'storage', 'coordination', 'waitTimeFee'];
        for (const field of requiredFields) {
            if (this.pricing[field] === undefined && field !== 'taxRate') {
                throw new Error(`Missing pricing configuration for ${field}`);
            }
        }
        const quote = {
            baseFee: 0,
            distanceSurcharge: 0,
            itemHandlingFee: 0,
            expeditedServiceFee: 0,
            storageFee: 0,
            coordinationFee: 0,
            waitTimeFee: 0,
            subtotal: 0,
            tax: 0,
            total: 0,
            details: {
                distance: 0,
                items: [],
                expeditedNotice: '',
                storage: '',
                coordination: '',
            }
        };

        // 1. Base Fee
        quote.baseFee = this.pricing.baseFee || 0;

        // 2. Distance Surcharge
        const distance = parseFloat(formData.get('distance')) || 0;
        
        // Validate distance
        if (distance < 0) {
            throw new Error('Distance cannot be negative');
        }
        if (distance > 50) {
            quote.distanceSurcharge = (distance - 50) * this.pricing.distanceSurcharge.tier2 + (30 * this.pricing.distanceSurcharge.tier1);
        } else if (distance > 20) {
            quote.distanceSurcharge = (distance - 20) * this.pricing.distanceSurcharge.tier1;
        }
        quote.details.distance = distance;

        // 3. Item Handling Fee
        let items = [];
        try {
            items = JSON.parse(formData.get('items') || '[]');
        } catch (e) {
            throw new Error('Invalid items data format');
        }
        
        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }
        items.forEach(item => {
            const fee = this.pricing.itemHandling[item.size] || 0;
            quote.itemHandlingFee += fee * item.quantity;
            quote.details.items.push({ ...item, fee });
        });

        // 4. Expedited Service Fee
        const notice = formData.get('notice');
        if (notice === '48-72') {
            quote.expeditedServiceFee = (quote.baseFee + quote.distanceSurcharge + quote.itemHandlingFee) * 0.10;
            quote.details.expeditedNotice = '48-72 hours';
        } else if (notice === 'less-than-48') {
            quote.expeditedServiceFee = (quote.baseFee + quote.distanceSurcharge + quote.itemHandlingFee) * 0.20;
            quote.details.expeditedNotice = 'Less than 48 hours';
        }

        // 5. Storage Fee
        const storage = formData.get('storage');
        if (storage === '10x20') {
            quote.storageFee = this.pricing.storage.small;
            quote.details.storage = 'Up to 10x20';
        } else if (storage === '20x30') {
            quote.storageFee = this.pricing.storage.large;
            quote.details.storage = 'Up to 20x30';
        }

        // 6. Coordination Fee
        const coordination = formData.get('coordination');
        if (coordination === 'standard') {
            quote.coordinationFee = this.pricing.coordination.standard;
            quote.details.coordination = 'Standard';
        } else if (coordination === 'complex') {
            quote.coordinationFee = this.pricing.coordination.complex;
            quote.details.coordination = 'Complex';
        }

        // 7. Wait Time Fee
        const waitTime = parseFloat(formData.get('waitTime')) || 0;
        
        // Validate wait time
        if (waitTime < 0) {
            throw new Error('Wait time cannot be negative');
        }
        if (waitTime > 0.5) {
            quote.waitTimeFee = (waitTime - 0.5) * this.pricing.waitTimeFee;
        }

        // Calculate Subtotal
        quote.subtotal = quote.baseFee + quote.distanceSurcharge + quote.itemHandlingFee + quote.expeditedServiceFee + quote.storageFee + quote.coordinationFee + quote.waitTimeFee;

        // Calculate Tax (using default 8.5% if not specified in pricing object)
        const taxRate = this.pricing.taxRate || 0.085;
        quote.tax = quote.subtotal * taxRate;

        // Calculate Total
        quote.total = quote.subtotal + quote.tax;

        return quote;
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.QuoteCalculator = QuoteCalculator;
}
