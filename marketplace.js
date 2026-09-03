(() => {
"use strict";

const db = window.supabaseClient;
const $ = id => document.getElementById(id);

const grid = $("marketplace-products-grid");
const empty = $("marketplace-empty-state");
const count = $("marketplace-results-count");
const title = $("marketplace-results-title");
const form = $("marketplace-search-form");
const input = $("marketplace-search-input");
const sort = $("marketplace-sort-select");
const back = $("marketplace-buyer-back");
const cats = document.querySelectorAll("#marketplace-category-list button");

let products = [], category = "all", search = "";

if (!db) {
    if (count) count.textContent = "Erè koneksyon";
    return;
}

const clean = v => String(v || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const cat = v => {
    v = clean(v).replace(/[\s_-]/g, "");
    if (["electronique","elektronik","elektwonik"].includes(v)) return "electronique";
    if (["beaute","bote"].includes(v)) return "beaute";
    if (["digital","dijital"].includes(v)) return "digital";
    if (["maison","kay"].includes(v)) return "maison";
    if (["mode","vetman"].includes(v)) return "mode";
    return v || "lot";
};

const catName = v => ({
    mode:"Mode",
    electronique:"Elektwonik",
    maison:"Kay",
    beaute:"Bote",
    digital:"Dijital",
    lot:"Lòt"
}[cat(v)] || "Lòt");

const money = v => {
    v = Number(v);
    return Number.isFinite(v)
        ? new Intl.NumberFormat("fr-FR").format(v) + " HTG"
        : "Pri pa disponib";
};

async function buyerBack() {
    if (!back) return;

    const { data } = await db.auth.getUser();
    if (!data?.user) return;

    const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

    if (["acheteur","achte","buyer"].includes(clean(profile?.role))) {
        back.style.display = "block";
    }
}

// NOUVO: Li URL parameters pou pre-chaje kategori/search
function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const urlCat = params.get("category");
    const urlSearch = params.get("search");

    if (urlCat) {
        category = cat(urlCat);
        // Mete bouton aktif
        cats.forEach(x =>
            x.classList.toggle(
                "is-active",
                cat(x.dataset.categoryId) === category
            )
        );
    }

    if (urlSearch) {
        search = urlSearch;
        if (input) input.value = urlSearch;
    }
}

async function load() {
    count.textContent = "Ap chaje...";

    // CHANJMAN: itilize products_public olye de products
    // View la deja filtre is_active = true
    const { data, error } = await db
        .from("products_public")
        .select("*")
        .order("created_at", { ascending:false });

    if (error) {
        console.error("MACHEYA:", error);
        count.textContent = "Erè chajman";
        return;
    }

    products = data || [];
    render();
}

function render() {
    let list = [...products];
    const q = clean(search);

    if (category !== "all")
        list = list.filter(p => cat(p.category) === category);

    if (q)
        list = list.filter(p =>
            clean(p.name).includes(q) ||
            clean(p.description).includes(q) ||
            clean(p.category).includes(q)
        );

    if (sort.value === "price-low")
        list.sort((a,b) => Number(a.price||0) - Number(b.price||0));

    if (sort.value === "price-high")
        list.sort((a,b) => Number(b.price||0) - Number(a.price||0));

    if (sort.value === "name")
        list.sort((a,b) => String(a.name||"").localeCompare(String(b.name||""),"fr"));

    grid.innerHTML = "";

    count.textContent = `${list.length} pwodwi`;

    title.textContent =
        category === "all"
            ? q ? "Rezilta rechèch" : "Tout pwodwi"
            : catName(category);

    empty.setAttribute("aria-hidden", list.length ? "true" : "false");

    list.forEach(product => {
        const card = document.createElement("article");
        card.className = "marketplace-product-card";

        const image = document.createElement("div");
        image.className = "marketplace-product-image";

        if (product.image_url) {
            image.style.backgroundImage = `url("${product.image_url}")`;
            image.style.backgroundSize = "cover";
            image.style.backgroundPosition = "center";
        } else {
            image.textContent = "🛍️";
        }

        const content = document.createElement("div");
        content.className = "marketplace-product-content";

        const categoryEl = document.createElement("span");
        categoryEl.className = "marketplace-product-category";
        categoryEl.textContent = catName(product.category);

        const name = document.createElement("h3");
        name.className = "marketplace-product-name";
        name.textContent = product.name || "Pwodwi san non";

        const description = document.createElement("p");
        description.className = "marketplace-product-description";
        description.textContent = product.description || "";

        const bottom = document.createElement("div");
        bottom.className = "marketplace-product-bottom";

        const price = document.createElement("strong");
        price.className = "marketplace-product-price";
        price.textContent = money(product.price);

        const actions = document.createElement("div");
        actions.className = "marketplace-product-actions";

        const view = document.createElement("button");
        view.type = "button";
        view.className = "marketplace-product-button marketplace-view-button";
        view.textContent = "Gade pwodwi";

        view.onclick = () => {
            if (!product.id) return;
            location.href =
                "product-view.html?id=" +
                encodeURIComponent(product.id);
        };

        const buy = document.createElement("button");
        buy.type = "button";
        buy.className = "marketplace-product-button marketplace-buy-button";
        buy.textContent = "Achte kounye a";

        buy.onclick = () => {
            if (!product.id) return;
            location.href =
                "checkout.html?id=" +
                encodeURIComponent(product.id);
        };

        actions.append(view,buy);
        bottom.append(price,actions);
        content.append(categoryEl,name,description,bottom);
        card.append(image,content);
        grid.appendChild(card);
    });
}

form?.addEventListener("submit", e => {
    e.preventDefault();
    search = input?.value || "";
    render();
});

input?.addEventListener("input", () => {
    if (!input.value.trim()) {
        search = "";
        render();
    }
});

sort?.addEventListener("change", render);

cats.forEach(button => {
    button.onclick = () => {
        category = cat(button.dataset.categoryId);

        cats.forEach(x =>
            x.classList.toggle(
                "is-active",
                cat(x.dataset.categoryId) === category
            )
        );

        render();
    };
});

const menu = $("marketplace-side-menu");
const menuBtn = $("marketplace-menu-button");
const closeBtn = $("marketplace-close-menu-button");
const overlay = $("marketplace-menu-overlay");

function closeMenu() {
    menu?.classList.remove("is-open");
    overlay?.classList.remove("is-visible");
    menuBtn?.setAttribute("aria-expanded","false");
    menu?.setAttribute("aria-hidden","true");
}

function openMenu() {
    menu?.classList.add("is-open");
    overlay?.classList.add("is-visible");
    menuBtn?.setAttribute("aria-expanded","true");
    menu?.setAttribute("aria-hidden","false");
}

menuBtn?.addEventListener("click",openMenu);
closeBtn?.addEventListener("click",closeMenu);
overlay?.addEventListener("click",closeMenu);

document.addEventListener("keydown",e => {
    if (e.key === "Escape") closeMenu();
});

// Inisyalizasyon
readUrlParams(); // NOUVO: li URL params anvan
if (category === "all") {
    cats[0]?.classList.add("is-active");
}

buyerBack();
load();

})();
