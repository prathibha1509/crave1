const RestaurantLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Restaurant Portal</h3>
                        <p class="text-muted">Sign in to manage your business</p>
                    </div>
                    
                    <form @submit.prevent="handleLogin">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" 
                                   class="form-control" 
                                   id="email" 
                                   v-model="email"
                                   placeholder="Enter your business email" 
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" 
                                   class="form-control" 
                                   id="password" 
                                   v-model="password"
                                   placeholder="Enter your password" 
                                   required>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block mt-4">Login</button>
                    </form>

                     <p class="text-center small mt-4">
                        Don't have an account? 
                        <router-link to="/restaurant/register">Register Your Restaurant</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            error: null,
        };
    },
    methods: {
        async handleLogin() {
            this.error = null; // Reset error before login attempt
            try {
                // Use the central login action from the Vuex store
                await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password,
                });

                // After successful login, verify the user has the 'owner' role
                const userRoles = this.$store.getters.userRoles;
                if (userRoles.includes('owner')) {
                    // Redirect to the restaurant dashboard
                    this.$router.push('/restaurant/dashboard');
                } else {
                    // If a non-owner logs in, deny access and log them out
                    this.$store.dispatch('logout'); 
                    throw new Error('Access denied. Restaurant owner credentials required.');
                }
            } catch (error) {
                // Display any login or permission errors
                this.error = error.message;
            }
        },
    },
};

export default RestaurantLoginPage;