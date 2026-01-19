const AdminReviewManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Review Moderation</h2>

            <div v-if="loading" class="alert alert-info">Loading all reviews...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card">
                <div class="card-body">
                    <p class="card-text text-muted">View and manage all customer reviews from across the platform.</p>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>Review ID</th>
                                    <th>Customer</th>
                                    <th>Restaurant</th>
                                    <th class="text-center">Rating</th>
                                    <th>Comment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="reviews.length === 0">
                                    <td colspan="6" class="text-center text-muted">There are no reviews to display.</td>
                                </tr>
                                <tr v-for="review in reviews" :key="review.id">
                                    <td>{{ review.id }}</td>
                                    <td>{{ review.customerName }}</td>
                                    <td><strong>{{ review.restaurantName }}</strong></td>
                                    <td class="text-center">
                                        <span class="review-stars text-warning">{{ '★'.repeat(review.rating) }}</span><span class="text-muted">{{ '☆'.repeat(5 - review.rating) }}</span>
                                    </td>
                                    <td>
                                        <div class="comment-cell">{{ review.comment }}</div>
                                    </td>
                                    <td class="table-actions">
                                        <button class="btn btn-sm btn-outline-danger" @click="deleteReview(review.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            reviews: []
        };
    },
    mounted() {
        this.fetchReviews();
    },
    methods: {
        async fetchReviews() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/reviews', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch reviews.");
                this.reviews = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async deleteReview(reviewId) {
            if (confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
                try {
                    const token = this.$store.state.token;
                    const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: { 'Authentication-Token': token }
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    alert(data.message);
                    // Refresh the list to remove the deleted review
                    this.fetchReviews();
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            }
        }
    }
};

export default AdminReviewManagementPage;
