const AdminRestaurantManagementPage = {
     template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Restaurant Management</h2>
                <div>
                    <button class="btn btn-outline-secondary mr-2" @click="exportData" :disabled="isExporting">
                        <span v-if="isExporting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
                    </button>
                    <button class="btn btn-brand" @click="openAddModal">Add Restaurant</button>
                </div>
            </div>

            <!-- This is the main error display for the page -->
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="loading" class="alert alert-info">Loading restaurant data...</div>

            <div class="card" v-if="!loading && !error">
                <div class="card-header bg-white">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" v-model="searchQuery" @input="fetchRestaurants" class="form-control" placeholder="Search by name, owner, or city...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" v-model="filterStatus" @change="fetchRestaurants">
                                <option value="All">All Statuses</option>
                                <option value="Verified">Verified</option>
                                <option value="Pending">Pending</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Restaurant Name</th>
                                    <th>Owner</th>
                                    <th>City</th>
                                    <th>Fees (D/P)</th>
                                    <th>Status</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="restaurants.length === 0">
                                    <td colspan="7" class="text-center text-muted">No restaurants match the current criteria.</td>
                                </tr>
                                <tr v-for="restaurant in restaurants" :key="restaurant.id">
                                    <td>{{ restaurant.id }}</td>
                                    <td><strong>{{ restaurant.name }}</strong></td>
                                    <td>{{ restaurant.ownerEmail }}</td>
                                    <td>{{ restaurant.city }}</td>
                                    <td>
                                        <div class="small">
                                            <span class="text-muted">D:</span> ₹{{ restaurant.deliveryFee || 0 }}<br>
                                            <span class="text-muted">P:</span> ₹{{ restaurant.platformFee || 0 }}
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge" :class="statusBadgeClass(restaurant.status)">
                                            {{ restaurant.status }}
                                        </span>
                                    </td>
                                    <td class="table-actions text-right">
                                        <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditModal(restaurant)">Edit</button>
                                        <button v-if="restaurant.status === 'Pending'" class="btn btn-sm btn-success mr-2" @click="approveRestaurant(restaurant)">Approve</button>
                                        <button v-if="restaurant.status === 'Verified'" class="btn btn-sm btn-warning mr-2" @click="blockRestaurant(restaurant)">Block</button>
                                        <button v-if="restaurant.status === 'Blocked'" class="btn btn-sm btn-info mr-2" @click="unblockRestaurant(restaurant)">Unblock</button>
                                        <button class="btn btn-sm btn-danger" @click="deleteRestaurant(restaurant)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- ✅ MODIFIED: Modal for Add/Edit Restaurant -->
            <div class="modal fade" id="restaurantModal" tabindex="-1" role="dialog">
                 <div class="modal-dialog modal-lg" role="document"> <!-- Made modal larger -->
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Restaurant</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                         <div class="modal-body">
                            <form @submit.prevent="saveRestaurant">
                                <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>
                                <div class="form-group">
                                   <label>Restaurant Name</label>
                                   <input type="text" class="form-control" v-model="currentRestaurant.name" required>
                                </div>
                                <div class="form-group">
                                    <label>Owner's Email</label>
                                    <input type="email" class="form-control" v-model="currentRestaurant.ownerEmail" required>
                                    <small class="form-text text-muted">The user must already exist with the 'owner' role.</small>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label>Delivery Fee (₹)</label>
                                        <input type="number" step="0.01" class="form-control" v-model.number="currentRestaurant.deliveryFee" required placeholder="0.00">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label>Platform Fee (₹)</label>
                                        <input type="number" step="0.01" class="form-control" v-model.number="currentRestaurant.platformFee" required placeholder="0.00">
                                    </div>
                                </div>
                                <hr>
                                <h6 class="form-section-title">Restaurant Location</h6>
                                <div class="form-group">
                                    <label>Address</label>
                                    <input type="text" class="form-control" v-model="currentRestaurant.address" required>
                                </div>
                                <div class="form-group">
                                    <label>City</label>
                                    <input type="text" class="form-control" v-model="currentRestaurant.city" required>
                                </div>
                                <div class="form-group">
                                   <button type="button" class="btn btn-sm btn-outline-secondary" @click="geocodeAddress" :disabled="isGeocoding">
                                        <span v-if="isGeocoding" class="spinner-border spinner-border-sm"></span>
                                        {{ isGeocoding ? 'Finding...' : 'Find on Map' }}
                                   </button>
                                </div>
                                <div class="form-row">
                                   <div class="form-group col-md-6">
                                        <label>Latitude</label>
                                        <input type="number" step="any" class="form-control" v-model.number="currentRestaurant.latitude" placeholder="e.g., 40.7128">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label>Longitude</label>
                                        <input type="number" step="any" class="form-control" v-model.number="currentRestaurant.longitude" placeholder="e.g., -74.0060">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveRestaurant">{{ isEditMode ? 'Save Changes' : 'Create Restaurant' }}</button>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    `,
     data() {
          return {
               loading: true,
               error: null,
               searchQuery: '',
               filterStatus: 'All',
               restaurants: [],
               isEditMode: false,
               currentRestaurant: {
                    id: null,
                    name: '',
                    ownerEmail: '',
                    address: '',
                    city: '',
                    latitude: null,
                    longitude: null,
                    deliveryFee: 0.0,
                    platformFee: 0.0
               },
               isExporting: false,
               isGeocoding: false, // For the modal's geocoding button
               modalError: null, // For errors inside the modal
          };
     },
     mounted() {
          this.fetchRestaurants();
     },
     methods: {
          // --- ✅ MODIFIED: Improved error handling ---
          async fetchRestaurants() {
               this.error = null;
               this.loading = true;
               try {
                    const token = this.$store.state.token;
                    if (!token) {
                         throw new Error("Authentication token is missing. Please log in again.");
                    }

                    const url = new URL('/api/admin/restaurants', window.location.origin);
                    if (this.searchQuery) url.searchParams.append('search', this.searchQuery);
                    if (this.filterStatus) url.searchParams.append('status', this.filterStatus);

                    const response = await fetch(url, { headers: { 'Authentication-Token': token } });

                    // This is the critical change: Check response.ok *before* trying to .json()
                    if (!response.ok) {
                         let errorMessage = `Error ${response.status}: ${response.statusText}`;
                         try {
                              // Try to parse an error message from the server's JSON response
                              const errorData = await response.json();
                              errorMessage = errorData.message || errorMessage;
                         } catch (e) {
                              // If .json() fails (it was HTML), the default message will be used.
                              console.error("Response was not JSON.", e);
                         }
                         throw new Error(errorMessage);
                    }

                    // Now it's safe to parse the JSON
                    const data = await response.json();
                    this.restaurants = data;

               } catch (err) {
                    // This will now show the *real* error, not "Unexpected token"
                    this.error = err.message;
               } finally {
                    this.loading = false;
               }
          },
          statusBadgeClass(status) {
               const statusMap = { 'Verified': 'badge-success', 'Pending': 'badge-warning', 'Blocked': 'badge-secondary' };
               return statusMap[status] || 'badge-light';
          },
          // --- ✅ MODIFIED: Removed confirm() and alert() ---
          async handleAction(url, method, confirmMessage) {
               // We are skipping the confirm() popup for a better UI
               // if (confirmMessage && !confirm(confirmMessage)) return; 
               this.error = null; // Clear previous page errors
               try {
                    const token = this.$store.state.token;
                    const response = await fetch(url, { method, headers: { 'Authentication-Token': token } });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    console.log(data.message); // Log success to console instead of alert
                    this.fetchRestaurants();
               } catch (err) {
                    this.error = 'Error: ' + err.message; // Show the error in the main error alert
               }
          },
          approveRestaurant(restaurant) {
               // Removed the confirm message
               this.handleAction(`/api/admin/restaurants/${restaurant.id}/verify`, 'PATCH');
          },
          blockRestaurant(restaurant) {
               this.handleAction(`/api/admin/restaurants/${restaurant.id}/block`, 'PATCH');
          },
          unblockRestaurant(restaurant) {
               this.handleAction(`/api/admin/restaurants/${restaurant.id}/unblock`, 'PATCH');
          },
          deleteRestaurant(restaurant) {
               // You can add a custom modal confirmation here later
               console.warn(`Delete action triggered for ${restaurant.name}`);
               this.handleAction(`/api/admin/restaurants/${restaurant.id}`, 'DELETE');
          },
          openAddModal() {
               this.isEditMode = false;
               this.modalError = null;
               this.currentRestaurant = { id: null, name: '', ownerEmail: '', address: '', city: '', latitude: null, longitude: null, deliveryFee: 0.0, platformFee: 0.0 };
               $('#restaurantModal').modal('show');
          },
          openEditModal(restaurant) {
               this.isEditMode = true;
               this.modalError = null;
               this.currentRestaurant = { ...restaurant }; // Use spread to copy all properties
               $('#restaurantModal').modal('show');
          },
          // --- ✅ MODIFIED: Removed alert() ---
          async saveRestaurant() {
               const token = this.$store.state.token;
               const url = this.isEditMode ? `/api/admin/restaurants/${this.currentRestaurant.id}` : '/api/admin/restaurants';
               const method = this.isEditMode ? 'PUT' : 'POST';
               this.modalError = null; // Clear previous modal errors
               try {
                    const response = await fetch(url, {
                         method,
                         headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                         body: JSON.stringify(this.currentRestaurant)
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    console.log(data.message); // Log success to console
                    $('#restaurantModal').modal('hide');
                    this.fetchRestaurants();
               } catch (err) {
                    this.modalError = 'Error: ' + err.message; // Show error inside the modal
               }
          },
          async geocodeAddress() {
               if (!this.currentRestaurant.address || !this.currentRestaurant.city) {
                    this.modalError = "Please enter an address and city first.";
                    return;
               }
               this.isGeocoding = true;
               this.modalError = null;
               try {
                    const fullAddress = `${this.currentRestaurant.address}, ${this.currentRestaurant.city}`;
                    const token = this.$store.state.token;
                    const response = await fetch('/api/geocode', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                         body: JSON.stringify({ address: fullAddress })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    this.currentRestaurant.latitude = data.latitude;
                    this.currentRestaurant.longitude = data.longitude;
               } catch (err) {
                    this.modalError = err.message;
               } finally {
                    this.isGeocoding = false;
               }
          },
          // --- ✅ MODIFIED: Removed alert() ---
          async exportData() {
               this.isExporting = true;
               this.error = null; // Clear previous page errors
               try {
                    const token = this.$store.state.token;
                    const response = await fetch('/api/admin/restaurants/export', { headers: { 'Authentication-Token': token } });
                    if (!response.ok) {
                         const errorData = await response.json();
                         throw new Error(errorData.message || 'Failed to download file.');
                    }
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'restaurants_export.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url); // Clean up the object URL
                    document.body.removeChild(a);
               } catch (err) {
                    this.error = 'Error exporting data: ' + err.message; // Show error on the page
               } finally {
                    this.isExporting = false;
               }
          }
     }
};
export default AdminRestaurantManagementPage;
