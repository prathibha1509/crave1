import apiService from '../../utils/apiService.js';

const CustomerCheckoutPage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-4">Finalize Your <span class="text-brand">Order</span></h2>
            <div class="row">
                <div class="col-lg-7">

                    <div class="card mb-4">
                        <div class="card-body">
                            <h4 class="card-title">1. Choose Order Type</h4>
                            <div class="btn-group btn-group-toggle d-flex">
                                <label class="btn btn-outline-brand w-100" :class="{ active: orderType === 'takeaway' }" @click="selectOrderType('takeaway')">
                                    <input type="radio" name="orderTypeOptions" value="takeaway" autocomplete="off"> <i class="fas fa-shopping-bag mr-2"></i>Takeaway
                                </label>
                                <label class="btn btn-outline-brand w-100" :class="{ active: orderType === 'dine_in' }" @click="selectOrderType('dine_in')">
                                    <input type="radio" name="orderTypeOptions" value="dine_in" autocomplete="off"> <i class="fas fa-utensils mr-2"></i>Dine-In
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="card mb-4">
                        <div class="card-body">
                            <h4 class="card-title">2. Choose When</h4>
                            
                            <div v-if="orderType === 'takeaway'" class="form-group">
                                <div class="btn-group btn-group-toggle d-flex">
                                    <label class="btn btn-outline-secondary w-100" :class="{ active: scheduleChoice === 'now' }" @click="scheduleChoice = 'now'">
                                        <input type="radio" value="now"> Order Now
                                    </label>
                                    <label class="btn btn-outline-secondary w-100" :class="{ active: scheduleChoice === 'later' }" @click="scheduleChoice = 'later'">
                                        <input type="radio" value="later"> Schedule for Later
                                    </label>
                                </div>
                            </div>
                            
                            <div v-if="isScheduling">
                                <hr v-if="orderType === 'takeaway'">
                                <p v-if="orderType === 'dine_in'" class="text-muted small">Please select a date and time for your reservation.</p>

                                <div v-if="slotsLoading" class="text-muted">Loading available slots...</div>
                                <div v-if="slotsError" class="alert alert-warning">{{ slotsError }}</div>
                                
                                <div v-if="!slotsLoading && availableDays.length > 0" class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="scheduleDate">Select Date</label>
                                        <select id="scheduleDate" class="form-control" v-model="selectedDate">
                                            <option v-for="day in availableDays" :key="day.date_value" :value="day.date_value">
                                                {{ day.date_display }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="scheduleTime">Select Time</label>
                                        <select id="scheduleTime" class="form-control" v-model="selectedTime" required>
                                            <option :value="null">-- Please select --</option>
                                            <option v-for="slot in slotsForSelectedDay" :key="slot.value" :value="slot.value">
                                                {{ slot.display }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h4 class="card-title">3. Apply Coupon</h4>

                            <div v-if="couponsLoading" class="text-muted small my-3">Loading available coupons...</div>
                            <div v-if="!couponsLoading && availableCoupons.length > 0" class="mb-3">
                                <small class="text-muted d-block mb-2">Available for you:</small>
                                <div>
                                    <button v-for="coupon in availableCoupons" 
                                            :key="coupon.code" 
                                            class="btn btn-sm btn-outline-success mr-2 mb-2"
                                            @click="selectAndApplyCoupon(coupon)"
                                            :disabled="!!appliedCoupon">
                                        {{ coupon.code }}
                                    </button>
                                </div>
                            </div>

                            <div v-if="couponError" class="alert alert-danger">{{ couponError }}</div>
                            <div v-if="appliedCoupon" class="alert alert-success">
                                <strong>'{{ appliedCoupon }}' applied!</strong> You saved ₹{{ discountAmount.toLocaleString('en-IN') }}.
                            </div>
                            <div class="input-group">
                                <input type="text" class="form-control" v-model="couponCode" placeholder="Enter coupon code" :disabled="!!appliedCoupon">
                                <div class="input-group-append">
                                    <button class="btn btn-brand" @click="applyCoupon" :disabled="isApplyingCoupon || !!appliedCoupon">
                                        {{ isApplyingCoupon ? '...' : 'Apply' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div class="col-lg-5">
                    <div class="card order-summary-card">
                        <div class="card-body">
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <h4 class="card-title">Order Summary</h4>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Subtotal</span><strong>₹{{ subtotal.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Delivery Fee</span><strong>₹{{ deliveryFee.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Platform Fee</span><strong>₹{{ platformFee.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li v-if="appliedCoupon" class="list-group-item d-flex justify-content-between text-success">
                                    <span>Discount</span><strong>-₹{{ discountAmount.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between total-row">
                                    <h5>Total</h5><h5>₹{{ total.toLocaleString('en-IN') }}</h5>
                                </li>
                            </ul>
                            <button class="btn btn-brand btn-block mt-4" @click="placeOrder" :disabled="isPlacing || isPaying || (isScheduling && !selectedTime)">
                                {{ isPaying ? 'Processing Payment...' : (isPlacing ? 'Placing Order...' : 'Place Order') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
data() {
        return {
            isPlacing: false,
            isPaying: false,
            error: null,
            deliveryFee: 50.00,
            orderType: 'takeaway',
            scheduleChoice: 'now',
            slotsLoading: true,
            slotsError: null,
            availableDays: [],
            selectedDate: null,
            selectedTime: null,
            isApplyingCoupon: false,
            couponCode: '',
            couponError: null,
            appliedCoupon: null,
            discountAmount: 0,
            availableCoupons: [],
            couponsLoading: true
        };
    },
     computed: {
        ...Vuex.mapGetters(['cartItems', 'cartTotal', 'cartRestaurantId']),
        subtotal() { 
            return this.cartTotal; 
        },
        total() { 
            return Math.max(0, this.subtotal + this.deliveryFee - this.discountAmount); 
        },
        isScheduling() { 
            return this.orderType === 'dine_in' || this.scheduleChoice === 'later'; 
        },
        slotsForSelectedDay() {
            if (!this.selectedDate) return [];
            const day = this.availableDays.find(d => d.date_value === this.selectedDate);
            return day ? day.slots : [];
        }
    },
    watch: {
        isScheduling(isScheduling) {
            if (isScheduling && this.availableDays.length > 0 && !this.selectedDate) {
                this.selectedDate = this.availableDays[0].date_value;
            } else if (!isScheduling) {
                this.selectedDate = null;
                this.selectedTime = null;
            }
        },
        selectedDate() { 
            this.selectedTime = null; 
        }
    },
    mounted() {
         this.fetchAvailableSlots();
         this.fetchApplicableCoupons();
    },
    methods: {
        selectOrderType(type) {
            this.orderType = type;
            this.selectedDate = null;
            this.selectedTime = null;
            this.appliedCoupon = null;
            this.discountAmount = 0;
            this.availableDays = [];
        },
        async fetchAvailableSlots() {
            if (!this.isScheduling || !this.selectedDate) return;
            this.slotsLoading = true;
            try {
                const data = await apiService.get(`/api/restaurant/${this.cartRestaurantId}/available-slots?date=${this.selectedDate}`);
                this.availableDays = data.days || [];
            } catch (err) {
                console.error('Failed to fetch slots', err);
                this.slotsError = 'Failed to load available slots';
            } finally {
                this.slotsLoading = false;
            }
        },
        async fetchApplicableCoupons() {
            if (!this.cartRestaurantId) return;
            this.couponsLoading = true;
            try {
                this.availableCoupons = await apiService.get(`/api/coupons/applicable/${this.cartRestaurantId}`);
            } catch (err) {
                console.error('Failed to fetch coupons:', err.message);
            } finally {
                this.couponsLoading = false;
            }
        },
        formatCouponDeal(coupon) {
            if (coupon.discount_type === 'Percentage') {
                return `${coupon.discount_value}% OFF`;
            }
            return `₹${coupon.discount_value} OFF`;
        },
        selectAndApplyCoupon(coupon) {
            this.couponCode = coupon.code;
            this.applyCoupon();
        },
        async applyCoupon() {
            if (!this.couponCode) {
                this.couponError = "Please enter a coupon code.";
                return;
            }
            this.isApplyingCoupon = true;
            this.couponError = null;
            try {
                const data = await apiService.post('/api/coupons/apply', {
                    code: this.couponCode,
                    subtotal: this.subtotal,
                    restaurant_id: this.cartRestaurantId
                });
                this.discountAmount = data.discount;
                this.appliedCoupon = this.couponCode;
            } catch (err) {
                this.couponError = err.message;
            } finally {
                this.isApplyingCoupon = false;
            }
        },
         loadRazorpayScript() {
            return new Promise((resolve, reject) => {
                if (window.Razorpay) return resolve(true);
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
                document.body.appendChild(script);
            });
        },
        async payWithRazorpay(orderId) {
             try {
                // Request server to create Razorpay order first (may use mock in dev)
                this.isPaying = true;
                const res = await apiService.post('/api/payments/create', { order_id: orderId });
                const { razorpay_order_id, razorpay_key, amount } = res;
         // Try to load Razorpay script
            try {
                await this.loadRazorpayScript();
                    
                // Real Razorpay checkout
                const options = {
                key: razorpay_key,
                amount: amount,
                currency: 'INR',
                name: 'Cravt',
                description: `Order #${orderId}`,
                order_id: razorpay_order_id,
                handler: async (response) => {
                this.isPaying = false;
                // Verify payment with server
                try {
                const verify = await apiService.post('/api/payments/verify', {
                                    order_id: orderId,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                });
                                    // Success: clear cart and navigate to order detail
                                this.$store.dispatch('clearCart');
                                alert('Payment successful!');
                                this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
                            } catch (verErr) {
                                console.error('Verification failed', verErr);
                                alert('Payment succeeded but verification failed. Please contact support.');
                                this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
                            }
                        },
                        prefill: {
                            name: (this.$store && this.$store.getters && this.$store.getters.currentUser) ? (this.$store.getters.currentUser.name || '') : '',
                            email: (this.$store && this.$store.getters && this.$store.getters.currentUser) ? (this.$store.getters.currentUser.email || '') : ''
                        },
                        theme: { color: '#E65100' }
                    };
        const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', (resp) => {
                        this.isPaying = false;
                        console.error('Payment failed', resp);
                        alert('Payment failed: ' + (resp.error && resp.error.description || 'Unknown error'));
                    });
                    rzp.open();
                    
                } catch (razorpayLoadError) {
                    // Razorpay SDK not available (development mode)
                    console.log('Razorpay SDK not available, using development mode payment');
                    
                    // In development, simulate payment with mock data
                    const mockPaymentId = 'pay_dev_' + Math.random().toString(36).substr(2, 9);
                    const mockSignature = 'mock_signature_' + Math.random().toString(36).substr(2, 9);
                    
                    this.isPaying = false;
                    try {
                        const verify = await apiService.post('/api/payments/verify', {
                            order_id: orderId,
                            razorpay_order_id: razorpay_order_id,
                            razorpay_payment_id: mockPaymentId,
                            razorpay_signature: mockSignature
                        });

                        // Success: clear cart and navigate to order detail
                        this.$store.dispatch('clearCart');
                        alert('Payment processed successfully (Development Mode)');
                        this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
                    } catch (verErr) {
                        console.error('Verification failed', verErr);
                        alert('Payment processing failed.');
                        this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
                    }
                }

            } catch (e) {
                this.isPaying = false;
                console.error('Payment error:', e);
                alert('Unable to start payment: ' + (e.message || e));
                // Fallback: redirect to order detail
                this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
            }
        },
        async placeOrder() {
            this.isPlacing = true;
            this.error = null;
            
            if (this.isScheduling && !this.selectedTime) {
                this.error = "Please select a time slot for your scheduled order.";
                this.isPlacing = false;
                return;
            }

            let payload = {
                restaurant_id: this.cartRestaurantId,
                order_type: this.orderType,
                items: this.cartItems.map(item => ({ menu_item_id: item.id, quantity: item.quantity })),
                coupon_code: this.appliedCoupon,
                scheduled_time: this.selectedTime
            };

            try {
                // Create internal order first
                const data = await apiService.post('/api/orders', payload);
                const orderId = data.order_id;

                // Start Razorpay payment flow for this order
                await this.payWithRazorpay(orderId);

            } catch (err) {
                this.error = err.message || "Failed to place order.";
            } finally {
                this.isPlacing = false;
            }
        }
    }
};
export default CustomerCheckoutPage;
