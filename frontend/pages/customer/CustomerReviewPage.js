const CustomerReviewPage = {
    template: `
        <div class="container my-5">
            <div v-if="loading" class="text-center">Loading...</div>
            <div v-else class="card review-form-card mx-auto">
                <div class="card-body">
                    <h4 class="card-title text-center mb-1">Leave a Review</h4>
                    <p class="text-center text-muted mb-4">For your order at <strong>{{ restaurantName }}</strong></p>
                    <form @submit.prevent="submitReview">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>
                        <div class="form-group text-center">
                            <label class="font-weight-bold">Your Rating</label>
                            <div class="star-rating">
                                <span v-for="star in 5" :key="star" @click="setRating(star)" class="star" :class="{ 'filled': star <= rating }">★</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="reviewComment" class="font-weight-bold">Your Comment (Optional)</label>
                            <textarea v-model="comment" class="form-control" id="reviewComment" rows="4" placeholder="How was your experience? What did you like?"></textarea>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block mt-4" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            isSubmitting: false,
            error: null,
            orderId: null,
            restaurantName: '',
            rating: 0,
            comment: ''
        };
    },
    mounted() {
        this.orderId = this.$route.params.orderId;
        this.restaurantName = this.$route.query.restaurantName; // Get name from query params
        if (!this.orderId || !this.restaurantName) {
            this.error = "Invalid order information.";
        }
        this.loading = false;
    },
    methods: {
        setRating(star) {
            this.rating = star;
        },
        async submitReview() {
            if (this.rating === 0) {
                this.error = 'Please select a star rating.';
                return;
            }
            this.isSubmitting = true;
            this.error = null;

            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/orders/${this.orderId}/review`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({
                        rating: this.rating,
                        comment: this.comment
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                alert(data.message);
                this.$router.push('/orders'); // Redirect back to order history on success

            } catch (err) {
                this.error = err.message;
            } finally {
                this.isSubmitting = false;
            }
        }
    }
};

export default CustomerReviewPage;

