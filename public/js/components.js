document.addEventListener("DOMContentLoaded", function () {
    function loadComponent(id, file, isHead = false, callback = null) {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                if (isHead) {
                    document.head.innerHTML = data; // Ensures <head> gets replaced
                } else {
                    let element = document.getElementById(id);
                    if (element) {
                        element.outerHTML = data;
                        if (callback) callback(); // Execute callback if provided
                    } else {
                        console.error(`❌ Error: Element #${id} not found!`);
                    }
                }
            })
            .catch(error => console.error(`❌ Error loading ${file}:`, error));
    }

    // Apply Bootstrap layout globally
    document.body.classList.add("d-flex", "flex-column", "min-vh-100");

    // Load Head
    loadComponent(null, '/components/head.html', true);

    // Load Navbar and Ensure Bootstrap JavaScript is Applied After Loading
    loadComponent('navbar', '/components/navbar.html', false, function () {
        let navbarToggler = document.querySelector(".navbar-toggler");
        if (navbarToggler) {
            navbarToggler.addEventListener("click", function () {
                let navbarCollapse = document.querySelector("#navbarNav");
                navbarCollapse.classList.toggle("show");
            });
        }
    });

    // Load Footer
    loadComponent('footer', '/components/footer.html');
});
