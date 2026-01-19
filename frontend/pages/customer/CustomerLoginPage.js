const CustomerLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Welcome Back!</h3>
                        <p class="text-muted">Sign in to continue to Foodle</p>
                    </div>
                    
                    <form @submit.prevent="handleLogin">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" 
                                   class="form-control" 
                                   id="email" 
                                   v-model="email"
                                   placeholder="Enter your email" 
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
                        
                        <div class="text-right mb-4">
                            <a href="#" class="small">Forgot Password?</a>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block">Login</button>
                    </form>

                    <div class="separator mt-4 mb-4">
                        <span>OR</span>
                    </div>

                    <!-- Google Sign-In Button -->
                    <div id="google-signin-btn" class="d-flex justify-content-center"></div>

                    <p class="text-center small mt-4">
                        Don't have an account? 
                        <router-link to="/register">Sign Up</router-link>
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
            googleClientId: null,
            isLoaded: false,
        };
    },
    async mounted() {
        await this.fetchConfig();
        this.checkRedirectCallback();
        this.initGoogleSignIn();
    },
    methods: {
        checkRedirectCallback() {
            const urlParams = new URLSearchParams(window.location.search);
            const googleToken = urlParams.get('google_token');
            const error = urlParams.get('error');

            if (googleToken) {
                // We got a token back from the redirect flow!
                const user = {
                    email: urlParams.get('email'),
                    name: urlParams.get('name'),
                    // We don't have roles in the URL but the store will fetch them or we can just redirect to profile
                    roles: ['customer'] // Default for Google login
                };

                this.$store.commit('SET_TOKEN', googleToken);
                this.$store.commit('SET_USER', user);

                // Clear the URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);

                // Redirect to home
                this.$router.push('/');
            } else if (error) {
                this.error = error;
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        },

        async fetchConfig() {
            try {
                const res = await fetch('/api/config');
                const data = await res.json();
                if (data.googleClientId) {
                    this.googleClientId = data.googleClientId;
                } else {
                    console.warn('Google Client ID not found in server config');
                }
            } catch (err) {
                console.error('Failed to fetch config:', err);
            }
        },

        initGoogleSignIn() {
            if (!this.googleClientId) {
                // Try again in a bit if config isn't loaded yet
                setTimeout(this.initGoogleSignIn, 500);
                return;
            }

            if (typeof google === 'undefined') {
                setTimeout(this.initGoogleSignIn, 500);
                return;
            }

            try {
                google.accounts.id.initialize({
                    client_id: this.googleClientId,
                    ux_mode: 'redirect', // Better for PWA/Standalone mode
                    login_uri: window.location.origin + '/api/google-login/redirect',
                    cancel_on_tap_outside: false,
                    context: 'signin',
                });

                google.accounts.id.renderButton(
                    document.getElementById('google-signin-btn'),
                    { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
                );

                this.isLoaded = true;
            } catch (err) {
                console.error('Error initializing Google Sign-In:', err);
                this.error = "Could not initialize Google Sign-In. Please check your internet connection.";
            }
        },

        async handleGoogleCallback(response) {
            this.error = null;
            try {
                const res = await fetch('/api/google-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: response.credential }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Google login failed.');
                }

                this.$store.commit('SET_TOKEN', data.token);
                this.$store.commit('SET_USER', data.user);

                // Redirect based on roles (same logic as handleLogin)
                const userRoles = this.$store.getters.userRoles;
                if (userRoles.includes('admin')) {
                    this.$router.push('/admin/dashboard');
                } else if (userRoles.includes('owner')) {
                    this.$router.push('/restaurant/dashboard');
                } else {
                    this.$router.push('/');
                }

            } catch (error) {
                this.error = error.message;
                console.error('Google Login Error:', error);
            }
        },

        async handleLogin() {
            this.error = null;
            try {
                // Call the central login action from the Vuex store
                await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password,
                });

                // --- THIS IS THE FIX ---
                // After successful login, check the user's roles and redirect accordingly.
                const userRoles = this.$store.getters.userRoles;

                if (userRoles.includes('admin')) {
                    this.$router.push('/admin/dashboard');
                } else if (userRoles.includes('owner')) {
                    this.$router.push('/restaurant/dashboard');
                } else {
                    // Default redirect for customers or if no specific role matches
                    this.$router.push('/');
                }

            } catch (error) {
                // If the store action throws an error, display it
                this.error = error.message;
            }
        },
    },
};

export default CustomerLoginPage;

