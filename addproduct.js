document.addEventListener("DOMContentLoaded", () => {

    const db = window.supabaseClient;

    if (!db) {
        alert("Supabase pa konekte.");
        return;
    }

    const form = document.getElementById("productForm");
    const imageInput = document.getElementById("productImage");
    const chooseImage = document.getElementById("chooseImageButton");
    const imageUpload = document.getElementById("imageUpload");
    const preview = document.getElementById("imagePreview");
    const placeholder = document.getElementById("imagePlaceholder");

    const typeInput = document.getElementById("productType");
    const stockInput = document.getElementById("productStock");

    const digitalSection = document.getElementById("digitalFileSection");
    const digitalInput = document.getElementById("digitalFile");

    const message = document.getElementById("formMessage");
    const button = document.getElementById("publishButton");

    const productName = document.getElementById("productName");
    const productPrice = document.getElementById("productPrice");
    const productCategory = document.getElementById("productCategory");
    const productDescription = document.getElementById("productDescription");

    // Detekte mòd edit
    const urlParams = new URLSearchParams(window.location.search);
    const editProductId = urlParams.get("id");
    let isEditMode = false;
    let existingProduct = null;

    /* ============================================================
       VERIFYE WÒL SELLER
    ============================================================ */

    async function verifySellerRole() {
        const { data: { user } } = await db.auth.getUser();

        if (!user) {
            window.location.href = "login.html";
            return false;
        }

        const { data: profile, error } = await db
            .from("profiles")
            .select("role, est_vendeur")
            .eq("id", user.id)
            .maybeSingle();

        if (error || !profile) {
            msg("Erè chajman pwofil.", "error");
            return false;
        }

        const role = String(profile.role || "").toLowerCase().trim();
        const isSeller = profile.est_vendeur === true;

        if (role !== "vendeur" && role !== "seller" && !isSeller) {
            msg("Ou pa gen pèmisyon pou kreye pwodwi.", "error");
            setTimeout(() => {
                window.location.href = "marketplace.html";
            }, 2000);
            return false;
        }

        return true;
    }

    /* ============================================================
       CHAJÉ PWODWI POU EDIT
    ============================================================ */

    async function loadProductForEdit() {
        if (!editProductId) return;

        isEditMode = true;
        msg("Ap chaje pwodwi a...", "info");

        const { data: { user } } = await db.auth.getUser();

        const { data: product, error } = await db
            .from("products")
            .select("*")
            .eq("id", editProductId)
            .eq("seller_id", user.id)
            .maybeSingle();

        if (error || !product) {
            msg("Pwodwi a pa jwenn oswa ou pa gen pèmisyon.", "error");
            setTimeout(() => {
                window.location.href = "seller.html";
            }, 2000);
            return;
        }

        existingProduct = product;

        // Pre-fill fòm
        productName.value = product.name || "";
        productPrice.value = product.price || "";
        productCategory.value = product.category || "";
        productDescription.value = product.description || "";
        typeInput.value = product.product_type || "physical";
        stockInput.value = product.stock || 0;

        // Montre imaj si genyen
        if (product.image_url) {
            preview.src = product.image_url;
            preview.style.display = "block";
            placeholder.style.display = "none";
        }

        // Chanje tit ak bouton
        document.title = "Modifye pwodwi | Macheya";
        document.querySelector("h1").textContent = "Modifye pwodwi";
        button.querySelector(".button-text").textContent = "Mete ajou pwodwi";

        updateType();
        hideMessage();
    }

    /* ============================================================
       FOTO
    ============================================================ */

    chooseImage.onclick = () => imageInput.click();
    imageUpload.onclick = () => imageInput.click();

    imageInput.onchange = () => {
        const file = imageInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Tanpri chwazi yon foto.");
            imageInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Foto a pa dwe depase 5 MB.");
            imageInput.value = "";
            return;
        }

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
        placeholder.style.display = "none";
    };

    /* ============================================================
       3 TYPES PWODWI
    ============================================================ */

    function updateType() {
        const type = typeInput.value;

        if (type === "digital") {
            digitalSection.style.display = "block";
            digitalInput.required = !isEditMode; // Pa obligatwa nan edit si deja genyen
            stockInput.value = 0;
            stockInput.disabled = true;
            stockInput.required = false;
        } else if (type === "service") {
            digitalSection.style.display = "none";
            digitalInput.required = false;
            digitalInput.value = "";
            stockInput.value = 0;
            stockInput.disabled = true;
            stockInput.required = false;
        } else {
            digitalSection.style.display = "none";
            digitalInput.required = false;
            digitalInput.value = "";
            stockInput.disabled = false;
            stockInput.required = true;
        }
    }

    typeInput.onchange = updateType;
    updateType();

    /* ============================================================
       MESAJ
    ============================================================ */

    function msg(text, type) {
        message.textContent = text;
        message.className = "form-message " + type;
        message.style.display = "block";
    }

    function hideMessage() {
        message.style.display = "none";
        message.textContent = "";
    }

    /* ============================================================
       NON FICHYE
    ============================================================ */

    function fileName(file) {
        const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
        return crypto.randomUUID() + ext;
    }

    /* ============================================================
       VALIDATION
    ============================================================ */

    function validateForm() {
        const errors = [];

        if (!productName.value.trim()) {
            errors.push("Non pwodwi obligatwa.");
        }

        const price = Number(productPrice.value);
        if (!price || price <= 0) {
            errors.push("Pri a dwe pi gran pase 0.");
        }

        if (!productCategory.value) {
            errors.push("Kategori obligatwa.");
        }

        if (!productDescription.value.trim()) {
            errors.push("Deskripsyon obligatwa.");
        }

        if (productDescription.value.trim().length < 10) {
            errors.push("Deskripsyon an dwe gen omwen 10 karaktè.");
        }

        const type = typeInput.value;
        const stock = Number(stockInput.value);

        if (type === "physical" && (!stock || stock < 0)) {
            errors.push("Stock dwe 0 oswa plis pou pwodwi fizik.");
        }

        if (!isEditMode) {
            const image = imageInput.files[0];
            if (!image && !existingProduct?.image_url) {
                errors.push("Foto pwodwi obligatwa.");
            }

            if (type === "digital" && !digitalInput.files[0]) {
                errors.push("Fichye dijital obligatwa.");
            }
        }

        return errors;
    }

    /* ============================================================
       SUBMIT
    ============================================================ */

    form.onsubmit = async (e) => {
        e.preventDefault();

        // Validation
        const errors = validateForm();
        if (errors.length > 0) {
            msg(errors.join(" "), "error");
            return;
        }

        button.disabled = true;
        button.classList.add("loading");

        let imagePath = null;
        let digitalPath = null;
        let newImageUploaded = false;
        let newDigitalUploaded = false;

        try {
            const { data: { user } } = await db.auth.getUser();

            if (!user) {
                throw new Error("Ou dwe konekte pou pibliye pwodwi.");
            }

            const type = typeInput.value;
            const image = imageInput.files[0];
            const digital = digitalInput.files[0];

            let imageUrl = existingProduct?.image_url || null;
            let digitalFileUrl = existingProduct?.digital_file_url || null;

            /* ====================================================
               UPLOAD FOTO (si gen nouvo)
            ==================================================== */

            if (image) {
                msg("📸 Upload foto a...", "success");

                imagePath = user.id + "/" + fileName(image);

                const { error: imageError } = await db.storage
                    .from("product-images")
                    .upload(imagePath, image, {
                        contentType: image.type,
                        upsert: false
                    });

                if (imageError) {
                    throw new Error("Foto a pa t ka upload: " + imageError.message);
                }

                newImageUploaded = true;

                const { data: imageURL } = db.storage
                    .from("product-images")
                    .getPublicUrl(imagePath);

                imageUrl = imageURL.publicUrl;
            }

            /* ====================================================
               UPLOAD FICHYE DIJITAL (si gen nouvo)
            ==================================================== */

            if (type === "digital" && digital) {
                msg("📁 Upload fichye dijital la...", "success");

                digitalPath = user.id + "/" + fileName(digital);

                const { error: digitalError } = await db.storage
                    .from("digital-products")
                    .upload(digitalPath, digital, {
                        contentType: digital.type || "application/octet-stream",
                        upsert: false
                    });

                if (digitalError) {
                    throw new Error("Fichye dijital la pa t ka upload: " + digitalError.message);
                }

                newDigitalUploaded = true;

                const { data: digitalURL } = db.storage
                    .from("digital-products")
                    .getPublicUrl(digitalPath);

                digitalFileUrl = digitalURL.publicUrl;
            }

            /* ====================================================
               DATABASE
            ==================================================== */

            msg("💾 Anrejistre pwodwi a...", "success");

            const productData = {
                name: productName.value.trim(),
                price: Number(productPrice.value),
                stock: type === "physical" ? Number(stockInput.value) : 0,
                category: productCategory.value,
                product_type: type,
                description: productDescription.value.trim(),
                seller_id: user.id,
                image_url: imageUrl,
                digital_file_url: digitalFileUrl,
                is_active: true
            };

            let dbError;

            if (isEditMode && existingProduct) {
                // UPDATE
                const { error } = await db
                    .from("products")
                    .update(productData)
                    .eq("id", existingProduct.id)
                    .eq("seller_id", user.id);

                dbError = error;
            } else {
                // INSERT
                const { error } = await db
                    .from("products")
                    .insert(productData);

                dbError = error;
            }

            if (dbError) {
                throw new Error("Pwodwi a pa t ka anrejistre: " + dbError.message);
            }

            /* ====================================================
               SUCCESS
            ==================================================== */

            msg(
                isEditMode ? "🎉 Pwodwi a mete ajou avèk siksè!" : "🎉 Pwodwi a pibliye avèk siksè!",
                "success"
            );

            setTimeout(() => {
                window.location.href = "seller.html";
            }, 1500);

        } catch (error) {
            console.error("MACHEYA ERROR:", error);

            // Netwayaj si upload te fèt men DB echwe
            if (newImageUploaded && imagePath) {
                await db.storage.from("product-images").remove([imagePath]);
            }

            if (newDigitalUploaded && digitalPath) {
                await db.storage.from("digital-products").remove([digitalPath]);
            }

            msg(error.message || "Yon erè rive.", "error");

        } finally {
            button.disabled = false;
            button.classList.remove("loading");
        }
    };

    /* ============================================================
       INISYALIZASYON
    ============================================================ */

    async function init() {
        const isSeller = await verifySellerRole();
        if (!isSeller) return;

        await loadProductForEdit();
    }

    init();

});
