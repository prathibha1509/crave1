const MenuItem = {
    props: ['item'],
    template: `
        <div class="card menu-card h-100">
            <img :src="item.image" class="card-img-top" :alt="item.name">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">{{ item.name }}</h5>
                
                <!-- ✅ START: THIS IS THE LINE THAT ADDS THE DESCRIPTION -->
                <p v-if="item.description" class="card-text text-muted small flex-grow-1">
                    {{ item.description }}
                </p>
                <!-- ✅ END: THIS IS THE LINE THAT ADDS THE DESCRIPTION -->
                
                <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                    <h4>₹{{ item.price.toLocaleString('en-IN') }}</h4>
                    <button class="btn btn-brand" @click="addToCart" :disabled="!item.is_available">
                        {{ item.is_available ? 'Buy Now' : 'Unavailable' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    methods: {
        addToCart() {
            // Emits an event to the parent component (CustomerRestaurantDetailPage)
            this.$emit('add-to-cart', this.item);
        }
    }
};

export default MenuItem;

