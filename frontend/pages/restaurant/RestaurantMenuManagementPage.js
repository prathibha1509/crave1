const RestaurantMenuManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Menu Management</h2>
                <button class="btn btn-brand" @click="openAddItemModal">
                    <i class="fas fa-plus mr-2"></i> Add Single Item
                </button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading your menu...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error">
                <!-- BULK UPLOAD SECTION -->
                <div class="card mb-4">
                    <div class="card-body">
                        <h4 class="card-title">Bulk Upload Menu</h4>
                        <p class="text-muted">Save time by uploading all your categories and menu items at once using our Excel template.</p>
                        <div v-if="uploadError" class="alert alert-danger">{{ uploadError }}</div>
                        <div v-if="uploadSuccess" class="alert alert-success">{{ uploadSuccess }}</div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-secondary mr-3" @click="downloadTemplate">
                                <i class="fas fa-download mr-2"></i>Download Template
                            </button>
                            <div class="custom-file">
                                <input type="file" class="custom-file-input" id="menuFile" @change="handleFileSelect" accept=".xlsx">
                                <label class="custom-file-label" for="menuFile">{{ selectedFile ? selectedFile.name : 'Choose Excel file...' }}</label>
                            </div>
                            <button class="btn btn-brand ml-3" @click="handleFileUpload" :disabled="!selectedFile || isUploading">
                                <span v-if="isUploading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                {{ isUploading ? 'Uploading...' : 'Upload' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- CATEGORY AND MENU DISPLAY -->
                <div v-if="categories.length === 0" class="card card-body text-center">
                    <p class="text-muted">Your menu is empty. Add a category and item manually, or use the bulk upload feature.</p>
                </div>
                
                <div v-for="category in categories" :key="category.id" class="card mb-4">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">{{ category.name }}</h4>
                    </div>
                    <div class="card-body">
                        <div v-if="category.menu_items.length === 0" class="text-center text-muted p-3">This category is empty.</div>
                        <div v-else class="table-responsive">
                            <table class="table table-hover mb-0 align-middle">
                                <tbody>
                                    <tr v-for="item in category.menu_items" :key="item.id">
                                        <td width="10%">
                                            <img :src="item.image || 'https://placehold.co/100x100/FFFBF8/FF7043?text=No+Image'" 
                                                 class="menu-item-img rounded" 
                                                 :alt="item.name">
                                        </td>
                                        <td>
                                            <strong>{{ item.name }}</strong>
                                            <!-- ✅ START: ADDED VEG/NON-VEG ICON -->
                                            <span v-if="item.food_type" class="ml-2" :title="item.food_type">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect x="1" y="1" width="14" height="14" rx="2" :stroke="item.food_type === 'Veg' ? '#28a745' : '#dc3545'" stroke-width="2"/>
                                                    <circle cx="8" cy="8" r="4" :fill="item.food_type === 'Veg' ? '#28a745' : '#dc3545'"/>
                                                </svg>
                                            </span>
                                            <!-- ✅ END: ADDED VEG/NON-VEG ICON -->
                                            <p class="text-muted small mb-0">{{ item.description }}</p>
                                        </td>
                                        <td class="text-center" width="10%">₹{{ item.price.toLocaleString('en-IN') }}</td>
                                        <td class="text-center" width="15%">
                                            <button class="btn btn-sm" :class="item.is_available ? 'btn-success' : 'btn-secondary'" @click="toggleAvailability(item)">
                                                {{ item.is_available ? 'Available' : 'Unavailable' }}
                                            </button>
                                        </td>
                                        <td class="text-right" width="15%">
                                            <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditItemModal(item, category.id)">Edit</button>
                                            <button class="btn btn-sm btn-outline-danger" @click="deleteItem(item.id)">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL FOR ADD/EDIT MENU ITEM -->
            <div class="modal fade" id="menuItemModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Menu Item</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveMenuItem">
                                <div class="form-group"><label>Item Name</label><input type="text" class="form-control" v-model="currentItem.name" required></div>
                                <div class="form-group"><label>Description</label><div class="input-group"><textarea class="form-control" v-model="currentItem.description" rows="3"></textarea><div class="input-group-append"><button class="btn btn-outline-brand" type="button" @click="generateDescription" :disabled="isGeneratingDesc"><span v-if="isGeneratingDesc" class="spinner-border spinner-border-sm"></span> ✨ {{ isGeneratingDesc ? '' : 'Generate' }}</button></div></div></div>
                                <div class="form-row">
                                    <div class="form-group col-md-6"><label>Price</label><input type="number" step="0.01" class="form-control" v-model.number="currentItem.price" required></div>
                                    <div class="form-group col-md-6"><label>Category</label><select class="form-control" v-model="currentItem.category_id" required><option v-for="cat in categories" :value="cat.id">{{ cat.name }}</option></select></div>
                                </div>
                                
                                <!-- ✅ START: ADDED FOOD TYPE SELECTOR TO MODAL -->
                                <div class="form-group">
                                    <label>Food Type</label>
                                    <select class="form-control" v-model="currentItem.food_type">
                                        <option :value="null">Select...</option>
                                        <option value="Veg">Veg</option>
                                        <option value="Non-Veg">Non-Veg</option>
                                    </select>
                                </div>
                                <!-- ✅ END: ADDED FOOD TYPE SELECTOR -->
                                
                                <div class="form-group"><label>Item Image</label><div class="custom-file"><input type="file" class="custom-file-input" id="itemImage" @change="handleImageSelect" accept="image/jpeg, image/png, image/webp"><label class="custom-file-label" for="itemImage">{{ imageFile ? imageFile.name : 'Choose image...' }}</label></div></div>
                                <div v-if="imagePreview" class="text-center mt-2"><img :src="imagePreview" class="img-fluid rounded mb-2" style="max-height: 200px;"/><button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage"><i class="fas fa-times mr-1"></i> Remove Image</button></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveMenuItem" :disabled="isSaving"><span v-if="isSaving" class="spinner-border spinner-border-sm"></span> {{ isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Item') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return { 
            loading: true, error: null, categories: [], isEditMode: false, currentItem: {},
            isUploading: false, uploadError: null, uploadSuccess: null, selectedFile: null,
            isSaving: false, imageFile: null, imagePreview: null,
            isGeneratingDesc: false,
        };
    },
    mounted() {
        this.fetchMenu();
    },
    methods: {
        async fetchMenu() {
            this.loading = true; this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/menu', { headers: { 'Authentication-Token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch menu.");
                // ✅ START: Ensure all menu items have a food_type property for reactivity
                this.categories = data.map(category => ({
                    ...category,
                    menu_items: category.menu_items.map(item => ({
                        ...item,
                        food_type: item.food_type || null
                    }))
                }));
                // ✅ END
            } catch (err) { this.error = err.message; } finally { this.loading = false; }
        },
        openAddItemModal() {
            this.isEditMode = false;
            // ✅ START: Initialize food_type for new items
            this.currentItem = { id: null, name: '', description: '', price: 0, category_id: this.categories[0]?.id || null, image: '', is_available: true, food_type: null };
            // ✅ END
            this.imageFile = null; this.imagePreview = null;
            $('#menuItemModal').modal('show');
        },
        openEditItemModal(item, categoryId) {
            this.isEditMode = true;
            this.currentItem = JSON.parse(JSON.stringify({ ...item, category_id: categoryId }));
            this.imageFile = null; this.imagePreview = item.image;
            $('#menuItemModal').modal('show');
        },
        handleImageSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            this.imageFile = file;
            this.imagePreview = URL.createObjectURL(file);
        },
        removeImage() {
            this.imageFile = null;
            this.imagePreview = null;
            this.currentItem.image = null; 
        },
        async saveMenuItem() {
            this.isSaving = true;
            try {
                if (this.imageFile) {
                    const formData = new FormData();
                    formData.append('image_file', this.imageFile);
                    const token = this.$store.state.token;
                    const uploadResponse = await fetch('/api/upload/image', {
                        method: 'POST',
                        headers: { 'Authentication-Token': token },
                        body: formData
                    });
                    const uploadData = await uploadResponse.json();
                    if (!uploadResponse.ok) throw new Error(uploadData.message || "Image upload failed.");
                    this.currentItem.image = uploadData.url;
                }

                const token = this.$store.state.token;
                const url = this.isEditMode ? `/api/restaurant/menu-items/${this.currentItem.id}` : '/api/restaurant/menu-items';
                const method = this.isEditMode ? 'PUT' : 'POST';

                const saveResponse = await fetch(url, { 
                    method, 
                    headers: { 'Content-Type': 'application/json', 'Authentication-Token': token }, 
                    body: JSON.stringify(this.currentItem) 
                });
                const saveData = await saveResponse.json();
                if (!saveResponse.ok) throw new Error(saveData.message);
                
                alert(saveData.message);
                $('#menuItemModal').modal('hide');
                this.fetchMenu();

            } catch (err) { 
                alert('Error: ' + err.message); 
            } finally {
                this.isSaving = false;
            }
        },
        async deleteItem(itemId) {
            if (!confirm('Are you sure you want to delete this item?')) return;
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/restaurant/menu-items/${itemId}`, { 
                    method: 'DELETE', 
                    headers: { 'Authentication-Token': token } 
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchMenu();
            } catch (err) { 
                alert('Error: ' + err.message); 
            }
        },
        async toggleAvailability(item) {
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/restaurant/menu-items/${item.id}/availability`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                    body: JSON.stringify({ is_available: !item.is_available })
                });
                if (!response.ok) throw new Error((await response.json()).message);
                item.is_available = !item.is_available;
            } catch (err) { 
                alert('Error: ' + err.message); 
            }
        },
        downloadTemplate() {
            // ✅ START: ADDED "Food Type" COLUMN TO THE EXCEL TEMPLATE
            const worksheet_data = [
                ["Category", "Name", "Description", "Price", "Food Type (Veg/Non-Veg)"],
                ["Starters", "Paneer Tikka", "Grilled cottage cheese cubes", 250, "Veg"],
                ["Main Course", "Butter Chicken", "Creamy tomato-based chicken curry", 450, "Non-Veg"],
            ];
            // ✅ END: ADDED "Food Type" COLUMN
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Template");
            XLSX.writeFile(workbook, "menu_template.xlsx");
        },
        handleFileSelect(event) {
            this.uploadSuccess = null; this.uploadError = null;
            this.selectedFile = event.target.files[0];
        },
        async handleFileUpload() {
            if (!this.selectedFile) {
                this.uploadError = "Please select a file first.";
                return;
            }
            this.isUploading = true; this.uploadError = null; this.uploadSuccess = null;
            const formData = new FormData();
            formData.append('menu_file', this.selectedFile);
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/menu/bulk-upload', {
                    method: 'POST',
                    headers: { 'Authentication-Token': token },
                    body: formData
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.uploadSuccess = data.message;
                this.selectedFile = null; document.getElementById('menuFile').value = null;
                await this.fetchMenu();
            } catch (err) {
                this.uploadError = "Upload failed: " + err.message;
            } finally {
                this.isUploading = false;
            }
        },
        async generateDescription() {
            if (!this.currentItem.name) {
                alert('Please enter a name for the menu item first.');
                return;
            }
            this.isGeneratingDesc = true;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/ai/generate-description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({ item_name: this.currentItem.name })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.currentItem.description = data.description;
                this.$forceUpdate(); 
            } catch (err) {
                alert('Error generating description: ' + err.message);
            } finally {
                this.isGeneratingDesc = false;
            }
        }
    }
};

export default RestaurantMenuManagementPage;

