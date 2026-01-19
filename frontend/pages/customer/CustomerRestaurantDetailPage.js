import MenuItem from '../../components/MenuItem.js';

const CustomerRestaurantDetailPage = {
    components: { MenuItem },
    template: `
        <div>
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-brand" role="status"><span class="sr-only">Loading...</span></div>
                <p class="mt-2">Loading restaurant details...</p>
            </div>
            <div v-if="error" class="container my-5"><div class="alert alert-danger">{{ error }}</div></div>

            <div v-if="!loading && !error && restaurant">
                <div class="restaurant-header text-center py-5 bg-light">
                    <div class="container">
                        <h1 class="font-weight-bold mb-3">{{ restaurant.name }}</h1>
                        <div class="mb-3" v-if="restaurant.reviews > 0">
                            <span class="badge badge-warning text-dark px-3 py-2">
                                <i class="fas fa-star mr-1"></i> {{ restaurant.rating }}
                            </span>
                            <small class="text-muted ml-2">({{ restaurant.reviews }} reviews)</small>
                        </div>
                        <div v-else class="text-muted mb-3">No reviews yet</div>
                        <p class="lead text-dark font-weight-bold mb-2">{{ restaurant.cuisine }}</p>
                        <p class="text-muted mb-4">{{ restaurant.description }}</p>
                        <div class="d-flex justify-content-center mb-4">
                            <div class="mx-3 text-center">
                                <p class="mb-0 text-brand font-weight-bold">₹{{ restaurant.deliveryFee || 0 }}</p>
                                <small class="text-muted">Delivery Fee</small>
                            </div>
                            <div class="mx-3 text-center border-left pl-3">
                                <p class="mb-0 text-brand font-weight-bold">₹{{ restaurant.platformFee || 0 }}</p>
                                <small class="text-muted">Platform Fee</small>
                            </div>
                        </div>
                        <p class="mb-4"><strong>Address:</strong> {{ restaurant.address }}</p>
                        
                        <button v-if="isCustomer" class="btn btn-outline-brand" @click="toggleFavorite">
                            <i :class="isFavorite ? 'fas fa-heart text-danger' : 'far fa-heart'"></i>
                            {{ isFavorite ? 'Favorited' : 'Add to Favorites' }}
                        </button>
                    </div>
                </div>

                <div class="container my-5">
                    <!-- Menu Items Section -->
                    <div v-for="category in restaurant.categories" :key="category.id" class="mb-5">
                        <h2 class="font-weight-bold mb-4">{{ category.name }}</h2>
                        <hr>
                        <div v-if="category.menu_items.length === 0" class="text-muted"><p>No items in this category yet.</p></div>
                        <div v-else class="row">
                            <div v-for="item in category.menu_items" :key="item.id" class="col-lg-4 col-md-6 mb-4">
                                <MenuItem :item="item" @add-to-cart="handleAddToCart" />
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reviews Section -->
                    <hr class="my-5">
                    <h2 class="font-weight-bold mb-4">What People Are Saying</h2>
                    <div v-if="reviewsLoading" class="text-center py-4">
                        <div class="spinner-border text-brand" role="status"></div>
                    </div>
                    <div v-if="!reviewsLoading && reviews.length === 0" class="alert alert-light border">Be the first to review this restaurant!</div>
                    <div v-if="!reviewsLoading && reviews.length > 0" class="mt-4">
                        <div v-for="review in reviews" :key="review.id" class="card shadow-sm mb-4 border-0">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="font-weight-bold mb-0">{{ review.customerName }}</h5>
                                    <span class="text-muted small">{{ review.date }}</span>
                                </div>
                                <div class="mb-3">
                                    <span class="text-warning mr-1" v-for="i in review.rating">★</span>
                                    <span class="text-muted small">({{ review.rating }}/5)</span>
                                </div>
                                <p class="card-text text-muted">{{ review.comment }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            restaurant: null,
            isFavorite: false,
            reviewsLoading: true,
            reviews: []
        };
    },
    computed: {
        ...Vuex.mapGetters(['userRoles']),
        isCustomer() {
            return this.userRoles && this.userRoles.includes('customer');
        }
    },
    async mounted() {
        await this.fetchRestaurantDetails();
        if (this.restaurant) {
            await this.fetchReviews();
            if (this.isCustomer) {
                await this.checkIfFavorite();
            }
        }
        this.initRevealAnimations();
    },
    methods: {
        initRevealAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1 });

            this.$nextTick(() => {
                document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
            });
        },
        async fetchRestaurantDetails() {
            this.loading = true;
            this.error = null;
            try {
                const restaurantId = this.$route.params.id;
                const response = await fetch(`/api/restaurants/${restaurantId}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch restaurant details.');
                this.restaurant = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async fetchReviews() {
            this.reviewsLoading = true;
            try {
                const response = await fetch(`/api/restaurants/${this.restaurant.id}/reviews`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.reviews = data;
            } catch (err) {
                console.error("Could not fetch reviews:", err.message);
            } finally {
                this.reviewsLoading = false;
            }
        },
        async checkIfFavorite() {
            if (!this.$store.getters.isAuthenticated) return;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/favorites', {
                    headers: { 'Authentication-Token': token }
                });
                if (!response.ok) throw new Error("Could not check favorites status.");
                const favorites = await response.json();
                if (favorites.some(fav => fav.id === this.restaurant.id)) {
                    this.isFavorite = true;
                }
            } catch (err) {
                console.error(err);
            }
        },
        async toggleFavorite() {
            const method = this.isFavorite ? 'DELETE' : 'POST';
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/favorites/${this.restaurant.id}`, {
                    method: method,
                    headers: { 'Authentication-Token': token },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.isFavorite = !this.isFavorite;
                alert(data.message);
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        handleAddToCart(item) {
            if (!this.$store.getters.isAuthenticated) {
                alert("Please log in to add items to your cart.");
                this.$router.push('/login');
                return;
            }
            this.$store.dispatch('addItemToCart', {
                item: item,
                restaurantId: this.restaurant.id
            });
            alert(`${item.name} has been added to your cart!`);
        }
    }
};

export default CustomerRestaurantDetailPage;

