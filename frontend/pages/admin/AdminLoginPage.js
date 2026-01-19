const AdminLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Admin Portal</h3>
                        <p class="text-muted">Sign in to manage the platform</p>
                    </div>
                    
                    <form @submit.prevent="handleLogin">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" 
                                   class="form-control" 
                                   id="email" 
                                   v-model="email"
                                   placeholder="Enter admin email" 
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" 
                                   class="form-control" 
                                   id="password" 
                                   v-model="password"
                                   placeholder="Enter password" 
                                   required>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block mt-4">Login</button>
                    </form>
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
                // We use the same central login action from the Vuex store
                await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password,
                });

                // Check if the logged-in user is actually an admin
                const userRoles = this.$store.getters.userRoles;
                if (userRoles.includes('admin')) {
                    // On success, redirect to the admin dashboard
                    this.$router.push('/admin/dashboard');
                } else {
                    // If a non-admin user tries to log in here, show an error
                    this.$store.dispatch('logout'); // Log them out immediately
                    throw new Error('Access denied. Administrator credentials required.');
                }
            } catch (error) {
                // If the store action throws an error, display it
                this.error = error.message;
            }
        },
    },
};

export default AdminLoginPage;