const AdminCouponManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Platform Coupon Management</h2>
                <button class="btn btn-brand" @click="openAddModal">Add New Coupon</button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading coupons...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="coupons.length === 0"><td colspan="5" class="text-center text-muted">No platform-wide coupons found.</td></tr>
                                <tr v-for="coupon in coupons" :key="coupon.id">
                                    <td><strong>{{ coupon.code }}</strong></td>
                                    <td>{{ coupon.type }}</td>
                                    <td>{{ coupon.type === 'Percentage' ? coupon.value + '%' : '$' + coupon.value.toFixed(2) }}</td>
                                    <td>
                                        <span class="badge" :class="coupon.isActive ? 'badge-success' : 'badge-secondary'">
                                            {{ coupon.isActive ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                    <td class="table-actions">
                                        <!-- ✅ START: ADDED TOGGLE BUTTON -->
                                        <button class="btn btn-sm mr-2" 
                                                :class="coupon.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                                                @click="toggleStatus(coupon)">
                                            {{ coupon.isActive ? 'Deactivate' : 'Activate' }}
                                        </button>
                                        <!-- ✅ END: ADDED TOGGLE BUTTON -->
                                        <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditModal(coupon)">Edit</button>
                                        <button class="btn btn-sm btn-outline-danger" @click="deleteCoupon(coupon.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="couponModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Coupon</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveCoupon">
                                <div class="form-group"><label>Coupon Code</label><input type="text" class="form-control" v-model="currentCoupon.code" required></div>
                                <div class="form-group"><label>Discount Type</label><select class="form-control" v-model="currentCoupon.type" required><option>Percentage</option><option>Fixed</option></select></div>
                                <div class="form-group"><label>Discount Value</label><input type="number" class="form-control" v-model.number="currentCoupon.value" required></div>
                                <div class="form-check"><input type="checkbox" class="form-check-input" id="isActiveCheck" v-model="currentCoupon.isActive"><label class="form-check-label" for="isActiveCheck">Active</label></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveCoupon">{{ isEditMode ? 'Save Changes' : 'Create Coupon' }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true, error: null, coupons: [], isEditMode: false,
            currentCoupon: { id: null, code: '', type: 'Percentage', value: 0, isActive: true }
        };
    },
    mounted() {
        this.fetchCoupons();
    },
    methods: {
        async fetchCoupons() {
            this.loading = true; this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/coupons', { headers: { 'Authentication-Token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch coupons.");
                this.coupons = data;
            } catch (err) { this.error = err.message; } finally { this.loading = false; }
        },
        openAddModal() {
            this.isEditMode = false;
            this.currentCoupon = { id: null, code: '', type: 'Percentage', value: 0, isActive: true };
            $('#couponModal').modal('show');
        },
        openEditModal(coupon) {
            this.isEditMode = true;
            this.currentCoupon = JSON.parse(JSON.stringify(coupon));
            $('#couponModal').modal('show');
        },
        async saveCoupon() {
            const token = this.$store.state.token;
            const url = this.isEditMode ? `/api/admin/coupons/${this.currentCoupon.id}` : '/api/admin/coupons';
            const method = this.isEditMode ? 'PUT' : 'POST';
            try {
                const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authentication-Token': token }, body: JSON.stringify(this.currentCoupon) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                $('#couponModal').modal('hide');
                this.fetchCoupons();
            } catch (err) { alert('Error: ' + err.message); }
        },
        async deleteCoupon(couponId) {
            if (!confirm('Are you sure you want to delete this coupon?')) return;
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/admin/coupons/${couponId}`, { method: 'DELETE', headers: { 'Authentication-Token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchCoupons();
            } catch (err) { alert('Error: ' + err.message); }
        },
        // ✅ START: ADDED METHOD TO TOGGLE STATUS
        async toggleStatus(coupon) {
            const action = coupon.isActive ? 'deactivate' : 'activate';
            if (!confirm(`Are you sure you want to ${action} the coupon '${coupon.code}'?`)) {
                return;
            }
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/admin/coupons/${coupon.id}/toggle`, {
                    method: 'PATCH',
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchCoupons(); // Refresh the list to show the new status
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
        // ✅ END: ADDED METHOD
    }
};

export default AdminCouponManagementPage;
