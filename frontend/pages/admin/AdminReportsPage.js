const AdminReportsPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Reports & Analytics</h2>

            <!-- Loading and Error States -->
            <div v-if="loading" class="alert alert-info">Loading report data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <!-- Main Content Area -->
            <div v-if="!loading && !error" class="row">

                <!-- Daily Revenue Chart -->
                <div class="col-lg-8 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title">Daily Revenue Trends (Last 7 Days)</h4>
                            <!-- The chart container is only displayed if there is data -->
                            <div v-if="revenueData.length > 0 && maxRevenue > 0" class="chart-container">
                                <div v-for="data in revenueData" :key="data.day" class="chart-bar-wrapper">
                                    <div class="chart-bar" :style="{ height: data.height + '%' }">
                                        <span class="bar-value">₹{{ data.revenue.toLocaleString('en-IN') }}</span>
                                    </div>
                                    <div class="chart-label">{{ data.day }}</div>
                                </div>
                            </div>
                            <!-- A message is shown if there is no revenue data to display -->
                            <p v-else class="text-muted mt-4">Not enough completed order data to display a chart. Please ensure some orders are marked as 'completed'.</p>
                        </div>
                    </div>
                </div>

                <!-- Top Restaurants List -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title">Top Restaurants by Revenue</h4>
                            <ul class="list-group list-group-flush">
                                <li v-if="topRestaurants.length === 0" class="list-group-item text-muted">No completed orders to rank restaurants.</li>
                                <li v-for="restaurant in topRestaurants" :key="restaurant.rank" class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="rank-badge">{{ restaurant.rank }}</span>
                                        <strong>{{ restaurant.name }}</strong>
                                    </div>
                                    <span class="font-weight-bold">₹{{ restaurant.revenue.toLocaleString('en-IN') }}</span>
                                </li>
                            </ul>
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
            rawRevenueData: [],
            topRestaurants: []
        };
    },
    computed: {
        // This computed property calculates the maximum revenue from the fetched data.
        // It's used to determine the relative height of the chart bars.
        maxRevenue() {
            if (!this.rawRevenueData || this.rawRevenueData.length === 0) {
                return 0;
            }
            return Math.max(...this.rawRevenueData.map(d => d.revenue));
        },
        // This computed property processes the raw data from the API to include a 'height'
        // percentage for each bar in the chart.
        revenueData() {
            if (!this.rawRevenueData || this.rawRevenueData.length === 0 || this.maxRevenue === 0) {
                // If there's no data or all revenue is 0, return data with 0 height for all bars.
                return this.rawRevenueData.map(d => ({ ...d, height: 0 }));
            }
            
            // Calculate the height of each bar as a percentage of the max revenue.
            return this.rawRevenueData.map(data => ({
                ...data,
                height: (data.revenue / this.maxRevenue) * 100
            }));
        }
    },
    mounted() {
        // This method is called automatically when the component is loaded.
        this.fetchReports();
    },
    methods: {
        // This method fetches the report data from your Flask backend.
        async fetchReports() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/reports', {
                    headers: { 'Authentication-Token': token }
                });
                
                // Check for server errors (like a 500 error)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: "An unknown server error occurred." }));
                    throw new Error(errorData.message || `Failed to fetch reports with status: ${response.status}`);
                }

                const data = await response.json();
                this.rawRevenueData = data.dailyRevenue;
                this.topRestaurants = data.topRestaurants;

            } catch (err) {
                this.error = err.message;
                console.error("Error fetching reports:", err);
            } finally {
                this.loading = false;
            }
        }
    }
};

export default AdminReportsPage;
