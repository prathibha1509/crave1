const RestaurantDashboardPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Restaurant Dashboard</h2>

            <div v-if="loading" class="alert alert-info">Loading dashboard data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error">
                <div class="row">
                    <div class="col-md-4 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TODAY'S REVENUE</h6>
                                <h3 class="stat-number">₹{{ stats.todaysRevenue.toLocaleString('en-IN') }}</h3>
                            </div>
                        </div>
                    </div>
                     <div class="col-md-4 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TODAY'S ORDERS</h6>
                                <h3 class="stat-number">{{ stats.todaysOrders.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">PENDING ORDERS</h6>
                                <h3 class="stat-number">{{ stats.pendingOrders }}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-lg-8 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h4 class="card-title mb-0">Recent Orders</h4>
                                    <button class="btn btn-sm btn-outline-brand" @click="$router.push('/restaurant/orders')">View All Orders</button>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <tbody>
                                            <tr v-if="recentOrders.length === 0">
                                                <td class="text-center text-muted">No recent orders to display.</td>
                                            </tr>
                                            <tr v-for="order in recentOrders" :key="order.id">
                                                <td><strong>#{{ order.id }}</strong></td>
                                                <td>{{ order.customerName }}</td>
                                                <td>{{ order.items }} items</td>
                                                <td>₹{{ order.total.toLocaleString('en-IN') }}</td>
                                                <td>
                                                    <span class="status-badge" :class="order.status.toLowerCase()">{{ order.status }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h4 class="card-title">Most Popular Items</h4>
                                <ul class="list-group list-group-flush popular-items-list">
                                    <li v-if="popularItems.length === 0" class="list-group-item text-muted">No order data yet.</li>
                                    <li v-for="(item, index) in popularItems" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{{ item.name }}</span>
                                        <span class="badge badge-primary badge-pill">{{ item.orders }} orders</span>
                                    </li>
                                </ul>
                            </div>
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
            stats: {
                todaysRevenue: 0,
                todaysOrders: 0,
                pendingOrders: 0,
            },
            recentOrders: [],
            popularItems: []
        };
    },
    mounted() {
        this.fetchDashboardData();
    },
    methods: {
        async fetchDashboardData() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                if (!token) throw new Error("Authentication error. Please log in again.");

                const response = await fetch('/api/restaurant/dashboard', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch dashboard data.");

                this.stats = data.stats;
                this.recentOrders = data.recentOrders;
                this.popularItems = data.popularItems;

            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        }
    }
};

export default RestaurantDashboardPage;
