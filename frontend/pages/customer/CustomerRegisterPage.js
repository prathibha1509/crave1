const CustomerRegisterPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Create an Account</h3>
                        <p class="text-muted">Join Foodle to order your favorite food!</p>
                    </div>
                    
                    <form @submit.prevent="handleRegister">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input type="text" 
                                   class="form-control" 
                                   id="name" 
                                   v-model="name"
                                   placeholder="Enter your full name" 
                                   required>
                        </div>

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
                                   placeholder="Create a password" 
                                   required>
                        </div>
                        
                        <button type="submit" class="btn btn-brand btn-block mt-4">Sign Up</button>
                    </form>

                    <div class="separator mt-4 mb-4">
                        <span>OR</span>
                    </div>

                    <!-- Google Sign-In Button (also works for Sign Up) -->
                    <div id="google-signup-btn" class="d-flex justify-content-center"></div>

                    <p class="text-center small mt-4">
                        Already have an account? 
                        <router-link to="/login">Login</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            name: '',
            email: '',
            password: '',
            error: null,
            // Replace with actual Google Client ID
            googleClientId: '31264651730-5ghtrtubc069u2b82lj4g58jlfrtgdt0.apps.googleusercontent.com',
        };
    },
    mounted() {
        this.initGoogleSignIn();
    },
    methods: {
        initGoogleSignIn() {
            if (typeof google === 'undefined') {
                setTimeout(this.initGoogleSignIn, 500);
                return;
            }

            google.accounts.id.initialize({
                client_id: this.googleClientId,
                callback: this.handleGoogleCallback,
            });

            google.accounts.id.renderButton(
                document.getElementById('google-signup-btn'),
                { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' }
            );
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
                    throw new Error(data.message || 'Google registration failed.');
                }

                this.$store.commit('SET_TOKEN', data.token);
                this.$store.commit('SET_USER', data.user);
                this.$router.push('/');

            } catch (error) {
                this.error = error.message;
                console.error('Google Auth Error:', error);
            }
        },

        async handleRegister() {
            this.error = null;
            if (this.password.length < 6) {
                this.error = 'Password must be at least 6 characters long.';
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.name,
                        email: this.email,
                        password: this.password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed.');
                }

                alert('Registration successful! Please log in.');
                this.$router.push('/login');

            } catch (err) {
                this.error = err.message;
            }
        },
    },
};

export default CustomerRegisterPage;