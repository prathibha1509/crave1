import apiService from '../../utils/apiService.js';

const CustomerProfilePage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Your <span class="text-brand">Profile</span></h2>

            <div v-if="loading" class="text-center">Loading profile...</div>
            <div v-if="error" class="alert alert-danger mx-auto" style="max-width: 500px;">{{ error }}</div>

            <div class="card profile-card mx-auto" v-if="!loading && !error">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h4 class="mt-3">{{ user.name }}</h4>
                    </div>

                    <form @submit.prevent="updateProfile">
                        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

                        <div class="form-group">
                            <label for="profileName">Full Name</label>
                            <input type="text" class="form-control" id="profileName" v-model="user.name">
                        </div>
                        <div class="form-group">
                            <label for="profileEmail">Email Address</label>
                            <input type="email" class="form-control" id="profileEmail" v-model="user.email" disabled>
                            <small class="form-text text-muted">Email address cannot be changed.</small>
                        </div>
                        
                        <button type="submit" class="btn btn-brand btn-block mt-4" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: false, // Will be handled by Vuex
            isSaving: false,
            error: null,
            successMessage: null,
            user: {
                name: '',
                email: '',
            },
        };
    },
    computed: {
        // Get the initial user data from the Vuex store
        currentUser() {
            return this.$store.getters.currentUser;
        }
    },
    created() {
        // When the component is created, populate the form with data from the store
        if (this.currentUser) {
            this.user.name = this.currentUser.name;
            this.user.email = this.currentUser.email;
        } else {
            // This is a safeguard in case the page is accessed without a logged-in user
            this.error = "Could not load user data. Please log in again.";
        }
    },
    methods: {
        async updateProfile() {
            this.successMessage = null;
            this.error = null;
            this.isSaving = true;
            
            try {
                // --- THIS IS THE FIX ---
                // No more manual fetch or token handling.
                const data = await apiService.put('/api/profile', { name: this.user.name });
                // --- END OF FIX ---

                // Commit the updated user object to the Vuex store
                this.$store.commit('SET_USER', data.user);

                this.successMessage = data.message;

            } catch (err) {
                this.error = err.message;
            } finally {
                this.isSaving = false;
            }
        }
    }
};

export default CustomerProfilePage;