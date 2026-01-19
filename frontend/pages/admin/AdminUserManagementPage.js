const AdminUserManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">User Management</h2>
                <button class="btn btn-outline-secondary" @click="exportData" :disabled="isExporting">
                    <span v-if="isExporting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
                </button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading user data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="card" v-if="!loading && !error">
                <div class="card-header bg-white">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" v-model="searchQuery" @input="fetchUsers" class="form-control" placeholder="Search by name or email...">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th class="text-center">Total Orders</th>
                                    <th>Total Spent</th>
                                    <th class="text-center">Status</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="users.length === 0">
                                    <td colspan="7" class="text-center text-muted">No users match the search query.</td>
                                </tr>
                                <tr v-for="user in users" :key="user.id">
                                    <td>{{ user.id }}</td>
                                    <td><strong>{{ user.name }}</strong></td>
                                    <td>{{ user.email }}</td>
                                    <td class="text-center">{{ user.totalOrders }}</td>
                                    <td>₹{{ user.totalSpent.toLocaleString('en-IN') }}</td>
                                    <td class="text-center">
                                        <span class="badge" :class="user.isBlocked ? 'badge-secondary' : 'badge-success'">
                                            {{ user.isBlocked ? 'Blocked' : 'Active' }}
                                        </span>
                                    </td>
                                    <td class="table-actions text-right">
                                        <button v-if="!user.isBlocked" class="btn btn-sm btn-warning" @click="blockUser(user)">Block</button>
                                        <button v-if="user.isBlocked" class="btn btn-sm btn-info" @click="unblockUser(user)">Unblock</button>
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
            users: [],
            isExporting: false,
        };
    },
    mounted() {
        this.fetchUsers();
    },
    methods: {
        async fetchUsers() {
            this.error = null;
            // Set loading to true only for the initial load
            if (this.users.length === 0) {
                this.loading = true;
            }
            try {
                const token = this.$store.state.token;
                const url = new URL('/api/admin/users', window.location.origin);
                if (this.searchQuery) {
                    url.searchParams.append('search', this.searchQuery);
                }
                const response = await fetch(url, {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch users.");
                this.users = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async handleUserAction(url, method, confirmMessage) {
            if (!confirm(confirmMessage)) return;
            try {
                const token = this.$store.state.token;
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchUsers(); // Refresh the list
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        blockUser(user) {
            this.handleUserAction(`/api/admin/users/${user.id}/block`, 'PATCH', `Are you sure you want to block ${user.name}? They will not be able to log in.`);
        },
        unblockUser(user) {
            this.handleUserAction(`/api/admin/users/${user.id}/unblock`, 'PATCH', `Are you sure you want to unblock ${user.name}?`);
        },
        async exportData() {
            this.isExporting = true;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/users/export', {
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
                a.download = 'users_export.xlsx';
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

export default AdminUserManagementPage;

