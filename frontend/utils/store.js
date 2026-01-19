/*
 * This is the complete store file.
 * It now includes all the missing logic for:
 * 1. Authentication (login, logout)
 * 2. Cart Management (addItemToCart, clearCart, etc.)
 *
 * All cart logic is also persisted to localStorage.
 */

const store = new Vuex.Store({
    state: {
        // Auth state
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,

        // Cart state
        cart: JSON.parse(localStorage.getItem('cart')) || [],
        cartRestaurantId: localStorage.getItem('cartRestaurantId') || null,
    },

    mutations: {
        // --- Auth Mutations ---
        SET_TOKEN(state, token) {
            state.token = token;
            localStorage.setItem('token', token);
        },

        SET_USER(state, user) {
            state.user = user;
            localStorage.setItem('user', JSON.stringify(user));
        },

        CLEAR_AUTH(state) {
            state.token = null;
            state.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },

        // --- 🛠️ START: CART MUTATIONS ---
        ADD_ITEM_TO_CART(state, { item, restaurantId }) {
            // Check if cart is empty or from the same restaurant
            if (state.cart.length === 0 || state.cartRestaurantId === restaurantId) {
                state.cartRestaurantId = restaurantId;

                const existingItem = state.cart.find(
                    cartItem => cartItem.id === item.id
                );

                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    state.cart.push({ ...item, quantity: 1 });
                }

                this.commit('SAVE_CART_TO_STORAGE');
            } else {
                alert(
                    'You can only order from one restaurant at a time. Please clear your cart to add this item.'
                );
            }
        },

        UPDATE_CART_QUANTITY(state, { id, quantity }) {
            const item = state.cart.find(cartItem => cartItem.id === id);
            if (item) {
                item.quantity = quantity;
            }
            this.commit('SAVE_CART_TO_STORAGE');
        },

        REMOVE_ITEM_FROM_CART(state, id) {
            state.cart = state.cart.filter(cartItem => cartItem.id !== id);

            if (state.cart.length === 0) {
                state.cartRestaurantId = null;
            }

            this.commit('SAVE_CART_TO_STORAGE');
        },

        CLEAR_CART(state) {
            state.cart = [];
            state.cartRestaurantId = null;
            this.commit('SAVE_CART_TO_STORAGE');
        },

        SAVE_CART_TO_STORAGE(state) {
            localStorage.setItem('cart', JSON.stringify(state.cart));
            localStorage.setItem('cartRestaurantId', state.cartRestaurantId);
        },
        // --- 🛠️ END: CART MUTATIONS ---
    },

    actions: {
        // --- Auth Actions ---
        async login({ commit }, { email, password }) {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            commit('SET_TOKEN', data.token);
            commit('SET_USER', data.user);
        },

        logout({ commit }) {
            commit('CLEAR_AUTH');
            commit('CLEAR_CART'); // Clear cart on logout
        },

        // --- 🛠️ START: CART ACTIONS ---
        addItemToCart({ commit }, { item, restaurantId }) {
            commit('ADD_ITEM_TO_CART', { item, restaurantId });
        },

        updateCartQuantity({ commit }, payload) {
            commit('UPDATE_CART_QUANTITY', payload);
        },

        removeItemFromCart({ commit }, itemId) {
            commit('REMOVE_ITEM_FROM_CART', itemId);
        },

        clearCart({ commit }) {
            commit('CLEAR_CART');
        },
        // --- 🛠️ END: CART ACTIONS ---
    },

    getters: {
        // Auth getters
        isAuthenticated: state => !!state.token,
        currentUser: state => state.user,
        userRoles: state => (state.user ? state.user.roles : []),

        // --- Cart Getters ---
        cartItems: state => state.cart,

        cartItemCount: state =>
            state.cart.reduce((total, item) => total + item.quantity, 0),

        cartTotal: state =>
            state.cart.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ),

        cartRestaurantId: state => state.cartRestaurantId,
    },
});

export default store;
