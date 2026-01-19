const AdminOrderManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Global Order Management</h2>
                <button class="btn btn-outline-secondary" @click="exportData" :disabled="isExporting">
                    <span v-if="isExporting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
                </button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading all orders...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card">
                <div class="card-header bg-white">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" v-model="searchQuery" @input="fetchOrders" class="form-control" placeholder="Search by Order ID, Customer, or Restaurant...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" v-model="filterStatus" @change="fetchOrders">
                                <option value="All">All Statuses</option>
                                <option value="Placed">Placed</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready">Ready</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>Order ID</th><th>Customer</th><th>Restaurant</th>
                                    <th>Date</th><th>Fees (D/P)</th><th>Total</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="orders.length === 0">
                                    <td colspan="7" class="text-center text-muted">No orders match the current filters.</td>
                                </tr>
                                <tr v-for="order in orders" :key="order.id">
                                    <td><strong>#{{ order.id }}</strong></td>
                                    <td>{{ order.customerName }}</td>
                                    <td>{{ order.restaurantName }}</td>
                                    <td>{{ order.date }}</td>
                                    <td>
                                        <small class="text-muted d-block">D: ₹{{ (order.deliveryFee || 0) }}</small>
                                        <small class="text-muted d-block">P: ₹{{ (order.platformFee || 0) }}</small>
                                    </td>
                                    <td>₹{{ order.total.toLocaleString('en-IN') }}</td>
                                    <td>
                                        <span class="status-badge" :class="order.status.toLowerCase()">
                                            {{ order.status }}
                                        </span>
                                    </td>
                                    <td class="table-actions">
                                        <button class="btn btn-sm btn-outline-secondary mr-2" @click="viewDetails(order.id)">View</button>
                                        <button class="btn btn-sm btn-outline-warning" 
                                                @click="initiateRefund(order.id)" 
                                                :disabled="order.status.toLowerCase() === 'refunded' || order.status.toLowerCase() === 'cancelled'">
                                            Refund
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
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
            orders: [],
            isExporting: false,
        };
    },
    mounted() {
        this.fetchOrders();
    },
    methods: {
        async fetchOrders() {
            this.error = null;
            if (this.orders.length === 0) {
                this.loading = true;
            }
            try {
                const token = this.$store.state.token;
                const url = new URL('/api/admin/orders', window.location.origin);
                if (this.searchQuery) {
                    url.searchParams.append('search', this.searchQuery);
                }
                if (this.filterStatus) {
                    url.searchParams.append('status', this.filterStatus);
                }

                const response = await fetch(url, {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch orders.");
                this.orders = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        viewDetails(orderId) {
            alert(`Viewing details for order #${orderId}. (Feature coming soon)`);
        },
        async initiateRefund(orderId) {
            if (confirm(`Are you sure you want to process a refund for order #${orderId}? This will change the order status to 'Refunded'.`)) {
                try {
                    const token = this.$store.state.token;
                    const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
                        method: 'POST',
                        headers: { 'Authentication-Token': token }
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    alert(data.message);
                    this.fetchOrders();
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            }
        },
        async exportData() {
            this.isExporting = true;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/orders/export', {
                    headers: { 'Authentication-Token': token }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to download file.');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'orders_export.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

            } catch (err) {
                alert('Error exporting data: ' + err.message);
            } finally {
                this.isExporting = false;
            }
        }
    }
};

export default AdminOrderManagementPage;

