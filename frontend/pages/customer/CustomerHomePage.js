import RestaurantCard from '../../components/RestaurantCard.js';

const CustomerHomePage = {
    components: {
        RestaurantCard
    },
    template: `
        <div>
            <!-- HERO SECTION -->
            <section class="hero-section">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-6 text-center text-lg-left hero-content-box">
                            <h1 class="hero-title">Experience The Best <span class="text-brand">Takeaway</span> In Your City</h1>
                            <p class="my-4 lead">Crav brings your favorite local flavors right to your fingertips. Fast, fresh, and ready when you are.</p>
                            <div class="hero-buttons">
                                <button class="btn btn-brand btn-lg shadow-sm mr-3" @click="scrollToFeatured">Order Now</button>
                                <button class="btn btn-outline-brand btn-lg shadow-sm" @click="scrollToNearby">Nearby Food</button>
                            </div>
                            
                            <!-- Motion Graphics Icons -->
                            <div class="motion-graphics d-none d-lg-block">
                                <div class="floating-icon icon-1"><i class="fas fa-burger text-brand"></i></div>
                                <div class="floating-icon icon-2"><i class="fas fa-pizza-slice text-brand"></i></div>
                                <div class="floating-icon icon-3"><i class="fas fa-drumstick-bite text-brand"></i></div>
                            </div>
                        </div>
                        <div class="col-lg-6 mt-5 mt-lg-0 hero-image-container">
                            <div class="hero-image-shadow"></div>
                            <img src="/assets/images/hero.jpg" class="img-fluid floating-hero" alt="Delicious takeaway food">
                        </div>
                    </div>
                </div>
            </section>
            

            <!-- RESTAURANTS SECTION -->
            <section class="restaurants-section text-center" id="nearby-restaurants">
                <div class="container">
                    <h2 class="mb-4">Restaurants <span class="text-brand">Near You</span></h2>
                    <p>Delicious food from local restaurants, right at your fingertips.</p>
                    
                    <!-- GEOLOCATION STATUS MESSAGES -->
                    <div v-if="isLocating" class="alert alert-info mt-5">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        Finding restaurants near your location...
                    </div>
                    <div v-if="locationError" class="alert alert-warning mt-5">
                        <strong>{{ locationError }}</strong>
                        <p>Showing featured restaurants instead.</p>
                    </div>

                    <!-- RESTAURANT LIST -->
                    <div v-if="!loading" class="row mt-5">
                        <div v-if="restaurants.length === 0 && !locationError" class="col-12">
                            <p class="text-muted">No restaurants found within a 7km radius. Showing featured restaurants instead.</p>
                        </div>
                        <div v-for="restaurant in restaurants" :key="restaurant.id" class="col-lg-4 col-md-6 mb-4">
                            <RestaurantCard :restaurant="restaurant" />
                        </div>
                    </div>
                </div>
            </section>

             <!-- REGULAR MENU -->
             <section class="menu-section text-center bg-light">
                 <div class="container">
                     <h2 class="mb-4">Our Regular <span class="text-brand">Menu</span></h2>
                     <p>These Are Our Regular Menus, You Can Order Anything You Like.</p>
                     
                     <div v-if="menuLoading" class="mt-5">
                        <div class="spinner-border text-brand" role="status"></div>
                        <p class="mt-2">Loading menu...</p>
                     </div>
                     <div v-if="menuError" class="alert alert-danger mt-5">{{ menuError }}</div>
                     
                     <div v-if="!menuLoading && !menuError" class="row mt-5">
                         <div v-for="item in menu" :key="item.id" class="col-lg-4 col-md-6 mb-4">
                            <div class="card menu-card h-100 shadow-sm border-0">
                                <div class="menu-img-container">
                                    <img :src="item.image" class="card-img-top" :alt="item.name" style="height: 220px; object-fit: cover;">
                                </div>
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title font-weight-bold">{{ item.name }}</h5>
                                    <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                                        <h4 class="mb-0 text-brand">₹{{ item.price.toLocaleString('en-IN') }}</h4>
                                        <button class="btn btn-brand btn-sm" @click="addToCart(item)">Buy Now</button>
                                    </div>
                                </div>
                            </div>
                         </div>
                     </div>
                 </div>
             </section>
             
             <footer class="footer-section py-5 bg-dark text-white text-center">
                 <div class="container">
                    <p>&copy; 2024 Crav Application. All Rights Reserved.</p>
                 </div>
             </footer>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            restaurants: [],
            menuLoading: true,
            menuError: null,
            menu: [],
            // --- ✅ START: GEOLOCATION STATE ---
            isLocating: true,
            locationError: null,
            // --- ✅ END: GEOLOCATION STATE ---
        }
    },
    mounted() {
        this.findNearbyRestaurants();
        this.fetchRegularMenu();
        this.initRevealAnimations();
    },
    methods: {
        initRevealAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1 });

            // Apply to all elements with 'reveal' class
            this.$nextTick(() => {
                document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
            });
        },
        scrollToMenu() {
            const el = document.getElementById('regular-menu');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        },
        // --- ✅ START: NEW GEOLOCATION METHODS ---
        findNearbyRestaurants() {
            this.isLocating = true;
            this.locationError = null;

            if (!navigator.geolocation) {
                this.isLocating = false;
                this.locationError = "Geolocation is not supported by your browser.";
                this.fetchFeaturedRestaurants(); // Fallback
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`/api/restaurants/nearby?lat=${latitude}&lng=${longitude}`);
                        const data = await response.json();
                        if (!response.ok) throw new Error("Could not fetch nearby restaurants.");

                        this.restaurants = data;
                        if (data.length === 0) {
                            // If no nearby are found, fetch featured as a fallback
                            this.fetchFeaturedRestaurants();
                        }
                    } catch (err) {
                        this.locationError = err.message;
                        this.fetchFeaturedRestaurants(); // Fallback on API error
                    } finally {
                        this.isLocating = false;
                        this.loading = false;
                    }
                },
                (error) => {
                    this.isLocating = false;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            this.locationError = "You denied the request for Geolocation.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            this.locationError = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            this.locationError = "The request to get user location timed out.";
                            break;
                        default:
                            this.locationError = "An unknown error occurred.";
                            break;
                    }
                    this.fetchFeaturedRestaurants(); // Fallback
                }
            );
        },
        // --- ✅ END: NEW GEOLOCATION METHODS ---

        // Renamed from fetchRestaurants to fetchFeaturedRestaurants to be more specific
        async fetchFeaturedRestaurants() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch('/api/restaurants/featured');
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load restaurants.");
                // If restaurants are already populated by nearby search, don't overwrite
                if (this.restaurants.length === 0) {
                    this.restaurants = data;
                }
            } catch (err) { this.error = err.message; } finally { this.loading = false; }
        },
        async fetchRegularMenu() {
            // This method remains unchanged
            this.menuLoading = true; this.menuError = null;
            try {
                const response = await fetch('/api/menu-items/regular');
                if (!response.ok) throw new Error("Failed to load the menu.");
                this.menu = await response.json();
            } catch (err) { this.menuError = err.message; } finally { this.menuLoading = false; }
        },
        addToCart(item) {
            // This method remains unchanged
            if (!this.$store.getters.isAuthenticated) {
                alert("Please log in to add items to your cart.");
                this.$router.push('/login');
                return;
            }
            this.$store.dispatch('addItemToCart', {
                item: item,
                restaurantId: item.restaurantId
            });
            alert(`${item.name} has been added to your cart!`);
        },
        scrollToFeatured() {
            // This method remains unchanged
            const element = document.getElementById('nearby-restaurants');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        },
        scrollToNearby() {
            const element = document.getElementById('nearby-restaurants');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        },
    }
};

export default CustomerHomePage;
