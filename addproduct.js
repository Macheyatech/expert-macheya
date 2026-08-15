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

    const digitalSection =
        document.getElementById("digitalFileSection");

    const digitalInput =
        document.getElementById("digitalFile");

    const message =
        document.getElementById("formMessage");

    const button =
        document.getElementById("publishButton");


    /* =========================
       FOTO
    ========================= */

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


    /* =========================
       3 TYPES
    ========================= */

    function updateType() {

        const type = typeInput.value;

        if (type === "digital") {

            digitalSection.style.display = "block";
            digitalInput.required = true;

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


    /* =========================
       MESAJ
    ========================= */

    function msg(text, type) {

        message.textContent = text;
        message.className = "form-message " + type;
        message.style.display = "block";
    }


    /* =========================
       NON FICHYE
    ========================= */

    function fileName(file) {

        const ext =
            file.name.includes(".")
                ? "." + file.name.split(".").pop()
                : "";

        return crypto.randomUUID() + ext;
    }


    /* =========================
       SUBMIT
    ========================= */

    form.onsubmit = async (e) => {

        e.preventDefault();

        const type = typeInput.value;
        const image = imageInput.files[0];
        const digital = digitalInput.files[0];

        if (!image) {
            msg("Tanpri ajoute yon foto pwodwi.", "error");
            return;
        }

        if (type === "digital" && !digital) {
            msg(
                "Tanpri ajoute fichye pwodwi dijital la.",
                "error"
            );
            return;
        }

        button.disabled = true;
        button.classList.add("loading");

        let imagePath = null;
        let digitalPath = null;

        try {

            /* USER */

            const {
                data: userData,
                error: userError
            } = await db.auth.getUser();

            if (userError || !userData.user) {
                throw new Error(
                    "Ou dwe konekte pou pibliye pwodwi."
                );
            }

            const userId = userData.user.id;


            /* FOTO */

            msg("📸 Upload foto a...", "success");

            imagePath =
                userId + "/" + fileName(image);

            const {
                error: imageError
            } = await db.storage
                .from("product-images")
                .upload(
                    imagePath,
                    image,
                    {
                        contentType: image.type,
                        upsert: false
                    }
                );

            if (imageError) {
                throw new Error(
                    "Foto a pa t ka upload: " +
                    imageError.message
                );
            }

            const {
                data: imageURL
            } = db.storage
                .from("product-images")
                .getPublicUrl(imagePath);


            /* FICHYE DIJITAL */

            if (type === "digital") {

                msg(
                    "📁 Upload fichye dijital la...",
                    "success"
                );

                digitalPath =
                    userId + "/" + fileName(digital);

                const {
                    error: digitalError
                } = await db.storage
                    .from("digital-products")
                    .upload(
                        digitalPath,
                        digital,
                        {
                            contentType:
                                digital.type ||
                                "application/octet-stream",
                            upsert: false
                        }
                    );

                if (digitalError) {
                    throw new Error(
                        "Fichye dijital la pa t ka upload: " +
                        digitalError.message
                    );
                }
            }


            /* DATABASE */

            msg(
                "💾 Anrejistre pwodwi a...",
                "success"
            );

            const product = {

                name:
                    document.getElementById(
                        "productName"
                    ).value.trim(),

                price:
                    Number(
                        document.getElementById(
                            "productPrice"
                        ).value
                    ),

                stock:
                    type === "physical"
                        ? Number(stockInput.value)
                        : 0,

                category:
                    document.getElementById(
                        "productCategory"
                    ).value,

                product_type:
                    type,

                description:
                    document.getElementById(
                        "productDescription"
                    ).value.trim(),

                seller_id:
                    userId,

                image_url:
                    imageURL.publicUrl,

                digital_file_url:
                    digitalPath,

                is_active:
                    true
            };


            const {
                error: insertError
            } = await db
                .from("products")
                .insert(product);

            if (insertError) {
                throw new Error(
                    "Pwodwi a pa t ka anrejistre: " +
                    insertError.message
                );
            }


            /* SUCCESS */

            msg(
                "🎉 Pwodwi a pibliye avèk siksè!",
                "success"
            );

            form.reset();

            updateType();

            preview.src = "";
            preview.style.display = "none";
            placeholder.style.display = "flex";


            setTimeout(() => {
                window.location.href =
                    "products.html";
            }, 1500);


        } catch (error) {

            console.error(
                "MACHEYA ERROR:",
                error
            );

            /* NETWAYAJ SI DATABASE ECHWE */

            if (imagePath) {

                await db.storage
                    .from("product-images")
                    .remove([imagePath]);
            }

            if (digitalPath) {

                await db.storage
                    .from("digital-products")
                    .remove([digitalPath]);
            }

            msg(
                error.message ||
                "Yon erè rive.",
                "error"
            );

        } finally {

            button.disabled = false;
            button.classList.remove("loading");
        }
    };

});
