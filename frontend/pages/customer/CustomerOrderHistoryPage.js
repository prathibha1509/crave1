// ✅ START: IMPORT THE REVIEW FORM COMPONENT
import ReviewForm from '../../components/ReviewForm.js';
// ✅ END: IMPORT

const CustomerOrderHistoryPage = {
    // ✅ START: REGISTER THE COMPONENT
    components: {
        ReviewForm,
    },
    // ✅ END: REGISTER
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Order <span class="text-brand">History</span></h2>

            <div v-if="loading" class="text-center"><p>Loading your order history...</p></div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error && orders.length > 0">
                <div v-for="order in orders" :key="order.id" class="card order-history-card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <h6 class="text-muted">ORDER #{{ order.id }}</h6>
                                <strong>{{ order.restaurantName }}</strong>
                            </div>
                            <div class="col-md-2">
                                <h6 class="text-muted">DATE</h6>
                                <strong>{{ order.date }}</strong>
                            </div>
                            <div class="col-md-2">
                                <h6 class="text-muted">TOTAL</h6>
                                <strong>₹{{ order.total.toLocaleString('en-IN') }}</strong>
                            </div>
                            <div class="col-md-2 text-center">
                                <span class="status-badge" :class="order.status.toLowerCase()">{{ order.status }}</span>
                            </div>
                            <div class="col-md-3 text-right">
                                <button class="btn btn-sm btn-outline-secondary mr-2" @click="viewOrderDetails(order.id)">View Details</button>
                                
                                <button v-if="order.status.toLowerCase() === 'completed' && !order.has_review" 
                                        class="btn btn-sm btn-brand" 
                                        @click="toggleReviewForm(order.id)">
                                    {{ activeReviewOrderId === order.id ? 'Cancel' : 'Leave a Review' }}
                                </button>
                                <span v-if="order.has_review" class="text-success small" style="vertical-align: middle;">
                                    <i class="fas fa-check-circle mr-1"></i> Reviewed
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="activeReviewOrderId === order.id" class="review-form-container border-top p-4">
                        <ReviewForm @review-submitted="submitReviewForOrder(order.id, $event)" />
                    </div>
                </div>
            </div>
            
            <div v-if="!loading && !error && orders.length === 0" class="text-center empty-state-container">
                <img src="/assets/images/empty-cart.png" alt="No Orders" class="empty-state-image" style="opacity: 0.5;">
                <h3 class="mt-4">You Haven't Placed Any Orders Yet</h3>
                <p>Your past orders will appear here.</p>
                <button class="btn btn-brand mt-2" @click="$router.push('/')">Start Ordering</button>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            orders: [],
            activeReviewOrderId: null,
        };
    },
    mounted() {
        this.fetchOrderHistory();
    },
    methods: {
        async fetchOrderHistory() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                if (!token) throw new Error("Authentication error.");

                const response = await fetch('/api/orders', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch order history.");
                this.orders = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        viewOrderDetails(orderId) {
            this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
        },
        toggleReviewForm(orderId) {
            this.activeReviewOrderId = this.activeReviewOrderId === orderId ? null : orderId;
        },
        async submitReviewForOrder(orderId, reviewData) {
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/orders/${orderId}/review`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({
                        rating: reviewData.rating,
                        comment: reviewData.comment
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                alert("Thank you for your review!");
                this.activeReviewOrderId = null;
                this.fetchOrderHistory();
            } catch (err) {
                alert('Error submitting review: ' + err.message);
            }
        }
    }
};

export default CustomerOrderHistoryPage;