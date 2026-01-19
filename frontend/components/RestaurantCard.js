const RestaurantCard = {
    props: ['restaurant'],
    template: `
        <div class="card restaurant-card h-100 shadow-sm border-0">
            <img :src="restaurant.image" class="card-img-top" :alt="restaurant.name" style="height: 220px; object-fit: cover;">
            <div class="card-body">
                <h5 class="card-title font-weight-bold">{{ restaurant.name }}</h5>
                <p class="card-text text-muted mb-3">{{ restaurant.cuisine }}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex flex-column align-items-start">
                        <div class="mb-2">
                             <span class="badge badge-warning text-dark px-2 py-1">
                                <i class="fas fa-star mr-1"></i> {{ restaurant.rating }}
                            </span>
                            <small class="text-muted ml-2">({{ restaurant.reviews }}+ reviews)</small>
                        </div>
                        <div class="text-brand small font-weight-bold">
                            <i class="fas fa-motorcycle mr-1"></i> ₹{{ restaurant.deliveryFee || 0 }} Delivery
                        </div>
                    </div>

                    <button class="btn btn-sm btn-outline-brand align-self-end mt-2" @click="viewMenu">
                        View Menu
                    </button>
                </div>
            </div>
        </div>
    `,
    methods: {
        viewMenu() {
            console.log('Navigating to restaurant:', this.restaurant.id);
            this.$router.push({ name: 'RestaurantDetail', params: { id: this.restaurant.id } });
        }
    }
};

export default RestaurantCard;
