document.addEventListener("DOMContentLoaded", function () {

    const menuButton = document.getElementById("menu-button");
    const sideMenu = document.getElementById("side-menu");
    const closeMenuButton = document.getElementById("close-menu-button");
    const menuOverlay = document.getElementById("menu-overlay");
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");

    function openMenu() {
        if (sideMenu) {
            sideMenu.classList.add("open");
            sideMenu.setAttribute("aria-hidden", "false");
        }

        if (menuOverlay) {
            menuOverlay.classList.add("open");
        }

        if (menuButton) {
            menuButton.setAttribute("aria-expanded", "true");
        }
    }

    function closeMenu() {
        if (sideMenu) {
            sideMenu.classList.remove("open");
            sideMenu.setAttribute("aria-hidden", "true");
        }

        if (menuOverlay) {
            menuOverlay.classList.remove("open");
        }

        if (menuButton) {
            menuButton.setAttribute("aria-expanded", "false");
        }
    }

    if (menuButton) {
        menuButton.addEventListener("click", function () {
            if (sideMenu && sideMenu.classList.contains("open")) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    if (closeMenuButton) {
        closeMenuButton.addEventListener("click", closeMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener("click", closeMenu);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const searchValue = searchInput.value.trim();

            if (searchValue === "") {
                searchInput.focus();
                return;
            }

            window.location.href =
                "marketplace.html?search=" +
                encodeURIComponent(searchValue);
        });
    }

    const categoryLinks =
        document.querySelectorAll("#categories-grid a");

    categoryLinks.forEach(function (category) {

        category.addEventListener("click", function () {

            const categoryId =
                category.getAttribute("data-category-id");

            if (!categoryId) {
                return;
            }

            window.location.href =
                "marketplace.html?category=" +
                encodeURIComponent(categoryId);
        });

    });

});
