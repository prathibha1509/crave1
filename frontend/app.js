import Navbar from "./components/Navbar.js"
import router from "./utils/router.js"
import store from "./utils/store.js"

const app = new Vue({
    el : '#app',
    template : /* html */`
        <div> 
            <Navbar />
            <router-view />
        </div>
    `,
    components : {
        Navbar,
    },
    router,
    store,
})