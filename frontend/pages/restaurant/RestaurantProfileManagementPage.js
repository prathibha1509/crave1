const RestaurantProfileManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Restaurant Profile Management</h2>

            <div v-if="loading" class="alert alert-info">Loading your profile...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card profile-management-card">
                <div class="card-body">
                    <form @submit.prevent="updateProfile">
                        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
                        
                        <div class="form-group d-flex justify-content-between align-items-center">
                            <div>
                                <h5>Accepting Orders</h5>
                                <p class="text-muted mb-0">Turn this off to temporarily stop receiving new orders.</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" v-model="restaurant.isActive">
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <hr class="my-4">

                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="restaurantName">Restaurant Name</label>
                                <input type="text" class="form-control" id="restaurantName" v-model="restaurant.name">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="openingHours">Opening Hours</label>
                                <input type="text" class="form-control" id="openingHours" v-model="restaurant.openingHours" placeholder="e.g., 9:00 AM - 10:00 PM">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" class="form-control" id="address" v-model="restaurant.address">
                        </div>
                         <div class="form-group">
                            <label for="city">City</label>
                            <input type="text" class="form-control" id="city" v-model="restaurant.city">
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea class="form-control" id="description" v-model="restaurant.description" rows="4" placeholder="A brief description of your restaurant..."></textarea>
                        </div>
                        
                        <hr class="my-4">

                        <h5>Photo Gallery</h5>
                        <div v-if="uploadError" class="alert alert-danger mt-2">{{ uploadError }}</div>
                        <div class="row gallery-thumbnails mt-3">
                            <div v-for="(image, index) in restaurant.gallery" :key="index" class="col-md-3 mb-3 gallery-item">
                                <img :src="image" class="img-fluid rounded">
                                <button type="button" class="btn btn-sm btn-danger remove-btn" @click="removePhoto(index)" title="Remove Image">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="photoUpload" class="upload-box">
                                    <div v-if="isUploading" class="spinner-border text-brand" role="status"></div>
                                    <div v-else>
                                        <i class="fas fa-plus fa-2x text-muted"></i>
                                        <span class="text-muted d-block mt-2">Add Photo</span>
                                    </div>
                                </label>
                                <input type="file" id="photoUpload" @change="handlePhotoUpload" accept="image/jpeg, image/png, image/webp" class="d-none">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-brand float-right" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            isSaving: false,
            error: null,
            successMessage: null,
            // --- MODIFIED: Initialized openingHours ---
            restaurant: {
                isActive: true, name: '', openingHours: '', address: '', city: '',
                description: '', gallery: []
            },
            // ✅ START: ADDED STATE FOR UPLOADING
            isUploading: false,
            uploadError: null,
            // ✅ END: ADDED STATE
        };
    },
    mounted() {
        this.fetchProfile();
    },
    methods: {
        async fetchProfile() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/profile', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load profile.");
                this.restaurant = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async updateProfile() {
            this.isSaving = true;
            this.successMessage = null;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify(this.restaurant)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.successMessage = data.message;
            } catch (err) {
                this.error = "Error: " + err.message;
            } finally {
                this.isSaving = false;
            }
        },
        // ✅ START: ADDED METHODS FOR PHOTO MANAGEMENT
        async handlePhotoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            this.isUploading = true;
            this.uploadError = null;

            const formData = new FormData();
            formData.append('image_file', file);
            
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/upload/image', {
                    method: 'POST',
                    headers: { 'Authentication-Token': token },
                    body: formData
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Image upload failed.');
                
                // Add the new image URL to the gallery
                this.restaurant.gallery.push(data.url);
            } catch (err) {
                this.uploadError = err.message;
            } finally {
                this.isUploading = false;
                event.target.value = ''; // Reset file input
            }
        },
        removePhoto(index) {
            if (confirm('Are you sure you want to remove this photo?')) {
                this.restaurant.gallery.splice(index, 1);
            }
        }
        // ✅ END: ADDED METHODS
    }
};

export default RestaurantProfileManagementPage;
