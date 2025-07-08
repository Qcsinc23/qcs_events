/**
 * Modern Interactions - Advanced UI/UX JavaScript
 * Handles sophisticated user interactions and modern web behaviors
 * Author: MiniMax Agent
 */

class ModernInteractions {
    constructor() {
        this.isInitialized = false;
        this.observers = new Map();
        this.animations = new Map();
        this.debounceTimers = new Map();
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupInteractions());
        } else {
            this.setupInteractions();
        }
        
        this.isInitialized = true;
    }

    setupInteractions() {
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupFormHandling();
        this.setupAnimations();
        this.setupMobileOptimizations();
        this.setupAccessibility();
        this.setupPerformanceOptimizations();
        
        console.log('🎨 Modern Interactions initialized');
    }

    /* ==========================================
       MODERN NAVIGATION SYSTEM
       ========================================== */

    setupNavigation() {
        const nav = document.getElementById('main-nav');
        const navLinks = document.querySelectorAll('.qc-nav-link');
        const mobileMenu = document.getElementById('mobile-menu');
        
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const navHeight = nav.offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active link
                    this.updateActiveNavLink(link);
                }
            });
        });

        // Navigation background on scroll
        this.setupScrollNavigation(nav);
        
        // Mobile menu functionality (if needed)
        if (mobileMenu) {
            this.setupMobileMenu(mobileMenu);
        }

        // Update active link on scroll
        this.setupScrollSpy(navLinks);
    }

    setupScrollNavigation(nav) {
        let lastScrollY = window.scrollY;
        let scrollDirection = 'up';
        
        const updateNav = () => {
            const currentScrollY = window.scrollY;
            scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
            
            // Add/remove scrolled class
            if (currentScrollY > 100) {
                nav.classList.add('scrolled');
                nav.style.background = 'rgba(255, 255, 255, 0.98)';
                nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            } else {
                nav.classList.remove('scrolled');
                nav.style.background = 'rgba(255, 255, 255, 0.95)';
                nav.style.boxShadow = 'none';
            }
            
            // Hide/show nav on scroll (optional)
            if (scrollDirection === 'down' && currentScrollY > 200) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
        };
        
        window.addEventListener('scroll', this.throttle(updateNav, 16));
    }

    setupScrollSpy(navLinks) {
        const sections = Array.from(navLinks).map(link => {
            const targetId = link.getAttribute('href').substring(1);
            return document.getElementById(targetId);
        }).filter(Boolean);

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeLink = document.querySelector(`a[href="#${entry.target.id}"]`);
                    if (activeLink) {
                        this.updateActiveNavLink(activeLink);
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
        this.observers.set('scrollSpy', observer);
    }

    updateActiveNavLink(activeLink) {
        // Remove active class from all links
        document.querySelectorAll('.qc-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current link
        activeLink.classList.add('active');
    }

    setupMobileMenu(mobileMenu) {
        // Implementation for mobile menu if needed
        // For now, we'll keep the design clean and minimal
        mobileMenu.addEventListener('click', () => {
            console.log('Mobile menu clicked - implement as needed');
        });
    }

    /* ==========================================
       ADVANCED SCROLL EFFECTS
       ========================================== */

    setupScrollEffects() {
        this.setupParallaxEffects();
        this.setupScrollRevealAnimations();
        this.setupProgressIndicators();
    }

    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.hero-background');
        
        if (parallaxElements.length === 0) return;

        const updateParallax = () => {
            const scrollY = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = 0.5;
                const yPos = -(scrollY * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        };

        window.addEventListener('scroll', this.throttle(updateParallax, 16));
    }

    setupScrollRevealAnimations() {
        const animatedElements = document.querySelectorAll(`
            .service-card,
            .testimonial-card,
            .hero-stat,
            .quote-form-container
        `);

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(element);
        });

        this.observers.set('scrollReveal', observer);
    }

    setupProgressIndicators() {
        const scrollIndicator = document.querySelector('.scroll-indicator');

        if (scrollIndicator) {
            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = (scrollTop / docHeight) * 100;
                scrollIndicator.style.width = `${scrollPercent}%`;
            });
        }
    }

    /* ==========================================
       ADVANCED FORM HANDLING
       ========================================== */

    setupFormHandling() {
        const quoteForm = document.getElementById('modern-quote-form');
        if (!quoteForm) return;

        this.setupFormValidation(quoteForm);
        this.setupFormSubmission(quoteForm);
        this.setupFormInteractions(quoteForm);
    }

    setupFormValidation(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
            
            // Enhanced accessibility
            input.addEventListener('focus', () => this.highlightField(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (required && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} is required`;
        }
        
        // Type-specific validation
        if (value && type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        if (value && type === 'tel') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Update field appearance
        this.updateFieldValidation(field, isValid, errorMessage);
        
        return isValid;
    }

    updateFieldValidation(field, isValid, errorMessage) {
        // Remove existing error styling
        field.style.borderColor = '';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid) {
            // Add error styling
            field.style.borderColor = 'var(--qc-error)';
            field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
            
            // Add error message
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = errorMessage;
            errorElement.style.cssText = `
                color: var(--qc-error);
                font-size: var(--qc-text-sm);
                margin-top: var(--qc-space-1);
                animation: qc-fade-in 0.3s ease;
            `;
            field.parentNode.appendChild(errorElement);
        }
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    highlightField(field) {
        field.style.borderColor = 'var(--qc-primary)';
        field.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
    }

    getFieldLabel(field) {
        const label = field.parentNode.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : 'This field';
    }

    setupFormSubmission(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate all fields in the current form (not just the active step)
            const activeStep = form.querySelector('.form-step.active');
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            let allValid = true;
            
            inputs.forEach(input => {
                // Only validate if the input is visible (in an active step)
                const isInActiveStep = activeStep.contains(input) || !input.closest('.form-step');
                if (isInActiveStep && !this.validateField(input)) {
                    allValid = false;
                }
            });

            if (!allValid) {
                this.showFormError('Please fill in all required fields');
                return;
            }

            // Show loading state
            this.showLoadingState(form);
            
            try {
                const result = await this.submitQuoteForm(form);
                // Don't show success message or reset form since we're displaying the quote
                // The quote display is handled in displayQuote method
            } catch (error) {
                console.error('Form submission error:', error);
                this.showFormError('Sorry, there was an error calculating your quote. Please try again or call (973) 415-9532.');
            } finally {
                this.hideLoadingState(form);
            }
        });
    }

    async submitQuoteForm(form) {
        const formData = new FormData(form);
        
        // Collect all items
        const items = [];
        const itemRows = form.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const size = row.querySelector('[name="item-size"]').value;
            const quantity = parseInt(row.querySelector('[name="item-quantity"]').value) || 1;
            items.push({ size, quantity });
        });
        
        // Set items in FormData
        formData.set('items', JSON.stringify(items));
        
        // Calculate quote using QuoteCalculator
        if (window.QuoteCalculator) {
            // Define pricing configuration
            const pricingConfig = {
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
            };
            
            const calculator = new window.QuoteCalculator(pricingConfig);
            const quote = calculator.calculateQuote(formData);
            this.displayQuote(quote, form);
            return { success: true, quote };
        }
        
        // Fallback to backend API if available
        if (window.backendAPI) {
            const response = await window.backendAPI.generateQuote(formData);
            return response;
        } else {
            // Fallback to local processing
            return this.processQuoteLocally(formData);
        }
    }

    displayQuote(quote, form) {
        // Hide all form steps
        const formSteps = form.querySelectorAll('.form-step');
        formSteps.forEach(step => step.classList.remove('active'));
        
        // Show quote result
        const quoteResult = document.getElementById('quote-result');
        const quoteDetails = document.getElementById('quote-details');
        
        quoteDetails.innerHTML = `
            <h4 style="color: white; margin-bottom: var(--qc-space-4);">Quote Breakdown</h4>
            <div style="display: grid; gap: var(--qc-space-2);">
                <div style="display: flex; justify-content: space-between;">
                    <span>Base Fee:</span>
                    <strong>$${quote.baseFee.toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Distance Surcharge:</span>
                    <strong>$${quote.distanceSurcharge.toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Item Handling Fee:</span>
                    <strong>$${quote.itemHandlingFee.toFixed(2)}</strong>
                </div>
                ${quote.expeditedServiceFee > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Expedited Service Fee:</span>
                    <strong>$${quote.expeditedServiceFee.toFixed(2)}</strong>
                </div>` : ''}
                ${quote.storageFee > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Storage Fee:</span>
                    <strong>$${quote.storageFee.toFixed(2)}</strong>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between;">
                    <span>Coordination Fee:</span>
                    <strong>$${quote.coordinationFee.toFixed(2)}</strong>
                </div>
                ${quote.waitTimeFee > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Wait Time Fee:</span>
                    <strong>$${quote.waitTimeFee.toFixed(2)}</strong>
                </div>` : ''}
                <hr style="border-color: rgba(255, 255, 255, 0.2); margin: var(--qc-space-2) 0;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal:</span>
                    <strong>$${quote.subtotal.toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: var(--qc-text-xl); margin-top: var(--qc-space-2);">
                    <span>Total:</span>
                    <strong style="color: #4ade80;">$${quote.total.toFixed(2)}</strong>
                </div>
            </div>
            <div style="margin-top: var(--qc-space-6); padding: var(--qc-space-4); background: rgba(255, 255, 255, 0.1); border-radius: var(--qc-radius-lg); border: 1px solid rgba(255, 255, 255, 0.2);">
                <h5 style="color: white; margin-bottom: var(--qc-space-2); font-size: var(--qc-text-base);">Important Information & Standard Terms</h5>
                <div style="font-size: var(--qc-text-sm); opacity: 0.9; line-height: 1.6;">
                    <p style="margin-bottom: var(--qc-space-2);">• This quote is valid for 30 days from the date of generation.</p>
                    <p style="margin-bottom: var(--qc-space-2);">• Final pricing may vary based on actual weight, dimensions, and service requirements verified at pickup.</p>
                    <p style="margin-bottom: var(--qc-space-2);">• Additional charges may apply for: residential delivery/pickup, inside delivery, liftgate service, or delivery appointment scheduling.</p>
                    <p style="margin-bottom: var(--qc-space-2);">• Fuel surcharges are subject to change based on current market rates.</p>
                    <p style="margin-bottom: var(--qc-space-2);">• Insurance coverage is included up to $100 per shipment. Additional coverage available upon request.</p>
                    <p style="margin-bottom: var(--qc-space-2);">• Delivery times are estimates and not guaranteed unless expedited service is selected.</p>
                    <p style="margin-bottom: var(--qc-space-2);">• Customer is responsible for proper packaging. Repackaging services available for additional fee.</p>
                    <p style="margin-bottom: var(--qc-space-3);">• Hazardous materials, perishables, and high-value items require special handling and prior approval.</p>
                    <p style="color: #4ade80; font-weight: 500;">✓ Our team will contact you within 15 minutes to confirm your requirements and finalize booking.</p>
                </div>
            </div>
        `;
        
        quoteResult.style.display = 'block';
    }

    processQuoteLocally(quoteData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Quote data processed locally:', quoteData);
                resolve({ success: true, message: 'Quote processed locally' });
            }, 1500);
        });
    }

    showLoadingState(form) {
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Processing...';
        }
        
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoadingState(form) {
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Get Instant Quote 🚀';
        }
        
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showFormSuccess(message) {
        this.showNotification(message, 'success');
    }

    showFormError(message) {
        this.showNotification(message, 'error');
    }

    setupFormInteractions(form) {
        if (!form) return;

        // Add item button functionality
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                const itemsContainer = document.getElementById('items-container');
                const newItemRow = document.createElement('div');
                newItemRow.className = 'item-row';
                newItemRow.style.cssText = 'display: flex; gap: var(--qc-space-2); margin-bottom: var(--qc-space-2);';
                newItemRow.innerHTML = `
                    <select name="item-size" class="quote-input" style="flex: 1;">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                    <input type="number" name="item-quantity" class="quote-input" min="1" value="1" style="width: 100px;" placeholder="Qty">
                    <button type="button" class="quote-submit" style="background: var(--qc-error); font-size: var(--qc-text-sm); padding: var(--qc-space-2);" onclick="this.parentElement.remove()">×</button>
                `;
                itemsContainer.appendChild(newItemRow);
            });
        }

        // Auto-format phone numbers
        const phoneInput = form.querySelector('input[type="tel"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 6) {
                    value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                } else if (value.length >= 3) {
                    value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
                }
                e.target.value = value;
            });
        }

        // Auto-set minimum date to today
        const dateInput = form.querySelector('input[type="date"]');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        // Multi-step form logic
        const nextButtons = form.querySelectorAll('.next-btn');
        const prevButtons = form.querySelectorAll('.prev-btn');
        const formSteps = form.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-bar-step');
        let currentStep = 0;

        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.validateStep(currentStep)) {
                    currentStep++;
                    this.updateFormStep(formSteps, progressSteps, currentStep);
                }
            });
        });

        prevButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStep--;
                this.updateFormStep(formSteps, progressSteps, currentStep);
            });
        });
    }

    validateStep(step) {
        const currentFormStep = document.querySelectorAll('.form-step')[step];
        const inputs = currentFormStep.querySelectorAll('input[required], select[required], textarea[required]');
        let allValid = true;
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });
        return allValid;
    }

    updateFormStep(formSteps, progressSteps, currentStep) {
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index <= currentStep);
        });
    }

    /* ==========================================
       MODERN ANIMATIONS
       ========================================== */

    setupAnimations() {
        this.setupHoverEffects();
        this.setupClickEffects();
        this.setupMicroInteractions();
    }

    setupHoverEffects() {
        // Enhanced card hover effects
        const cards = document.querySelectorAll('.service-card, .testimonial-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        // Button hover effects with ripple
        const buttons = document.querySelectorAll('.qc-btn, .hero-cta-primary, .hero-cta-secondary');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRippleEffect(e, button);
            });
        });
    }

    createRippleEffect(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    setupClickEffects() {
        // Add click animation to interactive elements
        const clickableElements = document.querySelectorAll('button, .qc-btn, a');
        clickableElements.forEach(element => {
            element.addEventListener('click', () => {
                element.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            });
        });
    }

    setupMicroInteractions() {
        // Floating elements animation
        this.setupFloatingAnimation();
        
        // Typing effect for hero title
        this.setupTypingEffect();
        
        // Counter animations for stats
        this.setupCounterAnimations();
    }

    setupFloatingAnimation() {
        const floatingElements = document.querySelectorAll('.hero-badge');
        floatingElements.forEach((element, index) => {
            element.style.animation = `float 3s ease-in-out ${index * 0.5}s infinite`;
        });
        
        // Add keyframes if not already present
        if (!document.querySelector('#floating-keyframes')) {
            const style = document.createElement('style');
            style.id = 'floating-keyframes';
            style.textContent = `
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes ripple {
                    to { transform: scale(4); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupTypingEffect() {
        const titleElement = document.querySelector('.hero-title');
        if (!titleElement) return;
        
        const originalText = titleElement.textContent;
        titleElement.textContent = '';
        
        let index = 0;
        const typeWriter = () => {
            if (index < originalText.length) {
                titleElement.textContent += originalText.charAt(index);
                index++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 1000);
    }

    setupCounterAnimations() {
        const counters = document.querySelectorAll('.hero-stat-number');
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const text = element.textContent;
        const numberMatch = text.match(/[\d.]+/);
        
        if (!numberMatch) return;
        
        const endValue = parseFloat(numberMatch[0]);
        const suffix = text.replace(numberMatch[0], '');
        const prefix = text.substring(0, text.indexOf(numberMatch[0]));
        
        let currentValue = 0;
        const increment = endValue / 50;
        const duration = 2000;
        const stepTime = duration / 50;
        
        const counter = setInterval(() => {
            currentValue += increment;
            if (currentValue >= endValue) {
                currentValue = endValue;
                clearInterval(counter);
            }
            
            const displayValue = currentValue % 1 === 0 ? 
                currentValue.toString() : 
                currentValue.toFixed(1);
                
            element.textContent = prefix + displayValue + suffix;
        }, stepTime);
    }

    /* ==========================================
       MOBILE OPTIMIZATIONS
       ========================================== */

    setupMobileOptimizations() {
        this.setupTouchGestures();
        this.setupMobileViewport();
        this.setupMobilePerformance();
    }

    setupTouchGestures() {
        // Enhanced touch interactions for mobile
        let touchStartY = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipeGesture(touchStartY, touchEndY);
        }, { passive: true });
    }

    handleSwipeGesture(startY, endY) {
        const swipeThreshold = 50;
        const difference = startY - endY;
        
        if (Math.abs(difference) > swipeThreshold) {
            if (difference > 0) {
                // Swipe up - could trigger some action
                console.log('Swipe up detected');
            } else {
                // Swipe down - could trigger some action
                console.log('Swipe down detected');
            }
        }
    }

    setupMobileViewport() {
        // Dynamic viewport height adjustment for mobile browsers
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', this.debounce(setVH, 100));
        window.addEventListener('orientationchange', this.debounce(setVH, 100));
    }

    setupMobilePerformance() {
        // Reduce animations on low-end devices
        if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
        }
        
        // Optimize for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--animation-duration', '0.01s');
        }
    }

    /* ==========================================
       ACCESSIBILITY ENHANCEMENTS
       ========================================== */

    setupAccessibility() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderOptimizations();
        this.setupColorContrastChecking();
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
            
            if (e.key === 'Escape') {
                // Close any open modals or dropdowns
                this.closeAllModals();
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    setupFocusManagement() {
        // Ensure proper focus indicators
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '2px solid var(--qc-primary)';
                element.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', () => {
                if (!document.body.classList.contains('keyboard-navigation')) {
                    element.style.outline = 'none';
                }
            });
        });
    }

    setupScreenReaderOptimizations() {
        // Add ARIA labels and descriptions where needed
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (!button.textContent.trim()) {
                button.setAttribute('aria-label', 'Interactive button');
            }
        });
        
        // Announce dynamic content changes
        this.createLiveRegion();
    }

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        
        // Store reference for announcements
        this.liveRegion = liveRegion;
    }

    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
        }
    }

    setupColorContrastChecking() {
        // Optional: Check color contrast ratios in development
        if (window.location.hostname === 'localhost') {
            this.checkColorContrast();
        }
    }

    checkColorContrast() {
        // Implementation for contrast checking (development only)
        console.log('Color contrast checking enabled for development');
    }

    /* ==========================================
       PERFORMANCE OPTIMIZATIONS
       ========================================== */

    setupPerformanceOptimizations() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCaching();
        this.setupBundleOptimization();
    }

    setupLazyLoading() {
        // Lazy load images and videos
        const lazyElements = document.querySelectorAll('[data-src]');
        
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        element.src = element.dataset.src;
                        element.removeAttribute('data-src');
                        lazyObserver.unobserve(element);
                    }
                });
            });
            
            lazyElements.forEach(element => lazyObserver.observe(element));
        }
    }

    setupImageOptimization() {
        // Implement responsive images
        const images = document.querySelectorAll('img:not([srcset])');
        images.forEach(img => {
            if (img.src && !img.srcset) {
                // Could add responsive image logic here
            }
        });
    }

    setupCaching() {
        // Service worker registration for caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }

    setupBundleOptimization() {
        // Code splitting and dynamic imports
        this.loadNonCriticalFeatures();
    }

    async loadNonCriticalFeatures() {
        // Load non-critical features after initial page load
        await this.waitForIdle();
        
        // Load additional features
        console.log('Loading non-critical features...');
    }

    waitForIdle() {
        return new Promise(resolve => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(resolve);
            } else {
                setTimeout(resolve, 100);
            }
        });
    }

    /* ==========================================
       UTILITY FUNCTIONS
       ========================================== */

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, delay) {
        let timeoutId;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), delay);
        };
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'var(--qc-success)' : type === 'error' ? 'var(--qc-error)' : 'var(--qc-primary)'};
            color: white;
            border-radius: var(--qc-radius-lg);
            box-shadow: var(--qc-shadow-lg);
            z-index: var(--qc-z-toast);
            animation: qc-slide-in 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'qc-fade-out 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    closeAllModals() {
        // Close any open modals or dropdowns
        const modals = document.querySelectorAll('.modal, .dropdown');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /* ==========================================
       CLEANUP
       ========================================== */

    destroy() {
        // Clean up observers and event listeners
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        this.animations.forEach(animation => animation.cancel());
        this.animations.clear();
        
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        console.log('🧹 Modern Interactions cleaned up');
    }
}

// Initialize when DOM is ready
const modernInteractions = new ModernInteractions();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernInteractions;
}

// Global reference
window.ModernInteractions = ModernInteractions;
