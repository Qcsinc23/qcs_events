class QuoteWidget {
    constructor() {
        this.widget = document.createElement('div');
        this.widget.className = 'quote-widget';
        this.calculator = new QuoteCalculator({
            baseFee: 200.00,
            distanceSurcharge: {
                tier1: 1.25,
                tier2: 1.75,
            },
            itemHandling: {
                small: 35.00,
                medium: 55.00,
                large: 75.00,
            },
            storage: {
                small: 475.00,
                large: 950.00,
            },
            coordination: {
                standard: 80.00,
                complex: 120.00,
            },
            waitTimeFee: 45.00,
        });
        this.init();
    }

    init() {
        this.widget.innerHTML = `
            <div class="quote-widget-header">
                <h2>Get an Instant Quote</h2>
                <p>Please fill out the form below to get a detailed quote.</p>
                <button class="close-btn">&times;</button>
            </div>
            <div class="quote-widget-body">
                <form id="quote-form">
                    <div class="form-step active">
                        <div class="form-group">
                            <label>Distance (miles)</label>
                            <input type="number" name="distance" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label>Expedited Service</label>
                            <select name="notice">
                                <option value="">None</option>
                                <option value="48-72">48-72 Hours Notice</option>
                                <option value="less-than-48">Less than 48 Hours Notice</option>
                            </select>
                        </div>
                        <button type="button" class="next-btn">Next</button>
                    </div>
                    <div class="form-step">
                        <div class="form-group">
                            <label>Item Details</label>
                            <div id="items-container">
                                <div class="item-row">
                                    <select name="item-size">
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                    <input type="number" name="item-quantity" min="1" value="1">
                                </div>
                            </div>
                            <button type="button" id="add-item-btn">Add Item</button>
                        </div>
                        <button type="button" class="prev-btn">Previous</button>
                        <button type="button" class="next-btn">Next</button>
                    </div>
                    <div class="form-step">
                        <div class="form-group">
                            <label>Storage</label>
                            <select name="storage">
                                <option value="">None</option>
                                <option value="10x20">Up to 10x20</option>
                                <option value="20x30">Up to 20x30</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Coordination</label>
                            <select name="coordination">
                                <option value="standard">Standard</option>
                                <option value="complex">Complex</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Wait Time (hours)</label>
                            <input type="number" name="waitTime" min="0" value="0">
                        </div>
                        <button type="button" class="prev-btn">Previous</button>
                        <button type="submit">Get Quote</button>
                    </div>
                </form>
                <div id="quote-result" style="display:none;">
                    <h3>Your Quote</h3>
                    <div id="quote-details"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.widget);
        this.bindEvents();
    }

    bindEvents() {
        const form = this.widget.querySelector('#quote-form');
        const nextButtons = this.widget.querySelectorAll('.next-btn');
        const prevButtons = this.widget.querySelectorAll('.prev-btn');
        const formSteps = this.widget.querySelectorAll('.form-step');
        const addItemBtn = this.widget.querySelector('#add-item-btn');
        const closeBtn = this.widget.querySelector('.close-btn');
        let currentStep = 0;

        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStep++;
                this.updateFormStep(formSteps, currentStep);
            });
        });

        prevButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStep--;
                this.updateFormStep(formSteps, currentStep);
            });
        });

        addItemBtn.addEventListener('click', () => {
            const itemsContainer = this.widget.querySelector('#items-container');
            const newItemRow = document.createElement('div');
            newItemRow.className = 'item-row';
            newItemRow.innerHTML = `
                <select name="item-size">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
                <input type="number" name="item-quantity" min="1" value="1">
            `;
            itemsContainer.appendChild(newItemRow);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const items = [];
            const itemRows = this.widget.querySelectorAll('.item-row');
            itemRows.forEach(row => {
                const size = row.querySelector('[name="item-size"]').value;
                const quantity = row.querySelector('[name="item-quantity"]').value;
                items.push({ size, quantity });
            });
            formData.set('items', JSON.stringify(items));
            const quote = this.calculator.calculateQuote(formData);
            this.displayQuote(quote);
        });

        closeBtn.addEventListener('click', () => {
            this.widget.remove();
        });
    }

    updateFormStep(formSteps, currentStep) {
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
    }

    displayQuote(quote) {
        const quoteDetails = this.widget.querySelector('#quote-details');
        quoteDetails.innerHTML = `
            <p><strong>Base Fee:</strong> $${quote.baseFee.toFixed(2)}</p>
            <p><strong>Distance Surcharge:</strong> $${quote.distanceSurcharge.toFixed(2)}</p>
            <p><strong>Item Handling Fee:</strong> $${quote.itemHandlingFee.toFixed(2)}</p>
            <p><strong>Expedited Service Fee:</strong> $${quote.expeditedServiceFee.toFixed(2)}</p>
            <p><strong>Storage Fee:</strong> $${quote.storageFee.toFixed(2)}</p>
            <p><strong>Coordination Fee:</strong> $${quote.coordinationFee.toFixed(2)}</p>
            <p><strong>Wait Time Fee:</strong> $${quote.waitTimeFee.toFixed(2)}</p>
            <p><strong>Subtotal:</strong> $${quote.subtotal.toFixed(2)}</p>
            <h3>Total: $${quote.total.toFixed(2)}</h3>
        `;
        this.widget.querySelector('#quote-result').style.display = 'block';
    }
}
