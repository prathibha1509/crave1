const RestaurantAnalyticsPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Business Analytics</h2>

            <div v-if="loading" class="alert alert-info">Loading analytics data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error">
                <div class="row">
                    <div class="col-md-4 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TOTAL REVENUE (Completed)</h6>
                                <h3 class="stat-number">₹{{ stats.totalRevenue.toLocaleString('en-IN') }}</h3>
                            </div>
                        </div>
                    </div>
                     <div class="col-md-4 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TOTAL ORDERS (Completed)</h6>
                                <h3 class="stat-number">{{ stats.totalOrders.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">AVG. ORDER VALUE</h6>
                                <h3 class="stat-number">₹{{ stats.avgOrderValue.toLocaleString('en-IN') }}</h3>
                                </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-lg-8 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h4 class="card-title">Daily Sales (Last 7 Days)</h4>
                                <div v-if="dailySalesData.length > 0" class="chart-container">
                                    <div v-for="data in dailySalesData" :key="data.day" class="chart-bar-wrapper">
                                        <div class="chart-bar" :style="{ height: data.height + '%' }">
                                            <span class="bar-value">₹{{ data.sales.toLocaleString('en-IN') }}</span>
                                        </div>
                                        <div class="chart-label">{{ data.day }}</div>
                                    </div>
                                </div>
                                <p v-else class="text-muted">Not enough sales data to display a chart.</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h4 class="card-title">Most Popular Items</h4>
                                <ul class="list-group list-group-flush popular-items-list">
                                    <li v-if="popularItems.length === 0" class="list-group-item text-muted">No order data to determine popular items.</li>
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
            stats: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
            rawDailySales: [],
            popularItems: []
        };
    },
    computed: {
        dailySalesData() {
            if (!this.rawDailySales || this.rawDailySales.length === 0) return [];
            const maxSales = Math.max(...this.rawDailySales.map(d => d.sales));
            if (maxSales === 0) return this.rawDailySales.map(d => ({ ...d, height: 0 }));
            
            return this.rawDailySales.map(data => ({
                ...data,
                height: (data.sales / maxSales) * 100
            }));
        }
    },
    mounted() {
        this.fetchAnalyticsData();
    },
    methods: {
        async fetchAnalyticsData() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/analytics', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch analytics.");

                this.stats = data.stats;
                this.rawDailySales = data.dailySales;
                this.popularItems = data.popularItems;

            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        }
    }
};

export default RestaurantAnalyticsPage;
