const CustomerRewardsPage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Loyalty & <span class="text-brand">Rewards</span></h2>

            <div v-if="loading" class="text-center">Loading your rewards details...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card text-center points-balance-card mb-4">
                        <div class="card-body">
                            <h6 class="text-muted">YOUR CURRENT BALANCE</h6>
                            <h1 class="points-total">{{ points_balance }} Points</h1>
                            <p>Earn points on every order and redeem them for discounts!</p>
                            <button class="btn btn-brand" disabled>Redeem Now (Coming Soon)</button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h4 class="card-title mb-4">Points History</h4>
                            <ul v-if="history.length > 0" class="list-group list-group-flush">
                                <li v-for="transaction in history" :key="transaction.id" class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{{ transaction.reason }}</strong>
                                        <br>
                                        <small class="text-muted">{{ transaction.date }}</small>
                                    </div>
                                    <span class="font-weight-bold" :class="transaction.type === 'earn' ? 'points-earn' : 'points-redeem'">
                                        {{ transaction.type === 'earn' ? '+' : '-' }}{{ transaction.points }}
                                    </span>
                                </li>
                            </ul>
                            <p v-else class="text-muted text-center">Your points history is empty. Place an order to start earning!</p>
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
            points_balance: 0,
            history: []
        };
    },
    mounted() {
        this.fetchRewardsData();
    },
    methods: {
        async fetchRewardsData() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                if (!token) throw new Error("You must be logged in to view your rewards.");

                const response = await fetch('/api/rewards', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Failed to fetch rewards data.");

                this.points_balance = data.points_balance;
                this.history = data.history;

            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        }
    }
};

export default CustomerRewardsPage;
