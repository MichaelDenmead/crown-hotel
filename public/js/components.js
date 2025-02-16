document.addEventListener("DOMContentLoaded", function () {
    function loadComponent(id, file, isHead = false) {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                if (isHead) {
                    document.head.innerHTML = data; // Ensures <head> gets replaced
                } else {
                    let element = document.getElementById(id);
                    if (element) {
                        element.outerHTML = data;
                    } else {
                        console.error(`❌ Error: Element #${id} not found!`);
                    }
                }
            })
            .catch(error => console.error(`❌ Error loading ${file}:`, error));
    }

    // Apply Bootstrap layout globally
    document.body.classList.add("d-flex", "flex-column", "min-vh-100");

    // Load Components
    loadComponent(null, '/components/head.html', true); // Load head
    loadComponent('navbar', '/components/navbar.html');
    loadComponent('footer', '/components/footer.html');
});
