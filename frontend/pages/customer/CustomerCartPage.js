import CartItem from '../../components/CartItem.js';

const CustomerCartPage = {
    components: { CartItem },
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-4">Your Shopping <span class="text-brand">Cart</span></h2>
            <div v-if="cartItems.length > 0" class="row">
                <div class="col-lg-8">
                    <div v-for="item in cartItems" :key="item.id">
                        <CartItem :cartItem="item" @update-quantity="updateQuantity" @remove-item="removeItem"/>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card order-summary-card">
                        <div class="card-body">
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
                                <li class="list-group-item d-flex justify-content-between total-row">
                                    <h5>Total</h5><h5>₹{{ total.toLocaleString('en-IN') }}</h5>
                                </li>
                            </ul>
                            <button class="btn btn-brand btn-block mt-4" @click="$router.push('/checkout')">Proceed to Checkout</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="text-center empty-cart-container">
                <img src="https://i.imgur.com/3a2N2p4.png" alt="Empty Cart" class="empty-cart-image">
                <h3 class="mt-4">Your Cart is Empty</h3>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button class="btn btn-brand mt-2" @click="$router.push('/')">Continue Shopping</button>
            </div>
        </div>
    `,
    data() {
        return {
            deliveryFee: 0.00,
            platformFee: 0.00,
            fetchingFees: false
        };
    },
    computed: {
        ...Vuex.mapGetters(['cartItems', 'cartTotal', 'cartRestaurantId']),
        subtotal() { return this.cartTotal; },
        total() { return this.subtotal + this.deliveryFee + this.platformFee; }
    },
    mounted() {
        this.fetchRestaurantFees();
    },
    methods: {
        updateQuantity(payload) { this.$store.dispatch('updateCartQuantity', payload); },
        removeItem(itemId) { this.$store.dispatch('removeItemFromCart', itemId); },
        async fetchRestaurantFees() {
            const restaurantId = this.cartRestaurantId;
            if (!restaurantId) return;

            this.fetchingFees = true;
            try {
                const response = await fetch(`/api/restaurants/${restaurantId}`);
                const data = await response.json();
                if (response.ok) {
                    this.deliveryFee = data.deliveryFee || 0;
                    this.platformFee = data.platformFee || 0;
                }
            } catch (err) {
                console.error("Error fetching restaurant fees:", err);
            } finally {
                this.fetchingFees = false;
            }
        }
    }
};
export default CustomerCartPage;
