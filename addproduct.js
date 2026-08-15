document.addEventListener("DOMContentLoaded", async () => {

    // =========================================================
    // SUPABASE
    // =========================================================

    if (!window.supabaseClient) {
        console.error("Supabase Client pa jwenn.");

        alert(
            "Supabase pa konekte. Verifye supabase-config.js."
        );

        return;
    }

    const supabase = window.supabaseClient;


    // =========================================================
    // ELEMENTS
    // =========================================================

    const productForm =
        document.getElementById("productForm");

    const productImage =
        document.getElementById("productImage");

    const chooseImageButton =
        document.getElementById("chooseImageButton");

    const imageUpload =
        document.getElementById("imageUpload");

    const imagePreview =
        document.getElementById("imagePreview");

    const imagePlaceholder =
        document.getElementById("imagePlaceholder");

    const imageError =
        document.getElementById("imageError");

    const productName =
        document.getElementById("productName");

    const productPrice =
        document.getElementById("productPrice");

    const productStock =
        document.getElementById("productStock");

    const productCategory =
        document.getElementById("productCategory");

    const productType =
        document.getElementById("productType");

    const productDescription =
        document.getElementById("productDescription");

    const digitalFileSection =
        document.getElementById("digitalFileSection");

    const digitalFile =
        document.getElementById("digitalFile");

    const formMessage =
        document.getElementById("formMessage");

    const publishButton =
        document.getElementById("publishButton");


    // =========================================================
    // BUCKETS
    // =========================================================

    const IMAGE_BUCKET =
        "images de produits";

    const DIGITAL_BUCKET =
        "produits numériques";


    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(message, type = "") {

        formMessage.textContent =
            message;

        formMessage.className =
            "form-message " + type;

        formMessage.style.display =
            "block";

        formMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    function hideMessage() {

        formMessage.style.display =
            "none";

        formMessage.textContent = "";
    }


    // =========================================================
    // CHWAZI FOTO
    // =========================================================

    chooseImageButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            productImage.click();
        }
    );


    imageUpload.addEventListener(
        "click",
        () => {

            productImage.click();
        }
    );


    // =========================================================
    // PREVIEW FOTO
    // =========================================================

    productImage.addEventListener(
        "change",
        () => {

            const file =
                productImage.files[0];

            imageError.textContent = "";

            if (!file) {
                return;
            }


            if (!file.type.startsWith("image/")) {

                imageError.textContent =
                    "Tanpri chwazi yon imaj.";

                productImage.value = "";

                return;
            }


            // 5 MB maximum

            const maxSize =
                5 * 1024 * 1024;

            if (file.size > maxSize) {

                imageError.textContent =
                    "Foto a pa dwe depase 5 MB.";

                productImage.value = "";

                return;
            }


            const imageURL =
                URL.createObjectURL(file);

            imagePreview.src =
                imageURL;

            imagePreview.style.display =
                "block";

            imagePlaceholder.style.display =
                "none";
        }
    );


    // =========================================================
    // TYPE PRODUIT
    // =========================================================

    function updateProductType() {

        const type =
            productType.value;


        // -----------------------------------------------------
        // DIGITAL
        // -----------------------------------------------------

        if (type === "digital") {

            digitalFileSection.style.display =
                "block";

            digitalFile.required =
                true;


            // Stock pa nesesè pou digital

            productStock.required =
                false;

            productStock.value =
                0;

            productStock.disabled =
                true;

        }


        // -----------------------------------------------------
        // PHYSICAL
        // -----------------------------------------------------

        else if (type === "physical") {

            digitalFileSection.style.display =
                "none";

            digitalFile.required =
                false;

            digitalFile.value =
                "";


            productStock.disabled =
                false;

            productStock.required =
                true;

        }


        // -----------------------------------------------------
        // SERVICE
        // -----------------------------------------------------

        else if (type === "service") {

            digitalFileSection.style.display =
                "none";

            digitalFile.required =
                false;

            digitalFile.value =
                "";


            // Sèvis pa gen stock fizik

            productStock.required =
                false;

            productStock.value =
                0;

            productStock.disabled =
                true;

        }


        // -----------------------------------------------------
        // PA CHWAZI
        // -----------------------------------------------------

        else {

            digitalFileSection.style.display =
                "none";

            digitalFile.required =
                false;

            digitalFile.value =
                "";


            productStock.disabled =
                false;

            productStock.required =
                true;
        }
    }


    productType.addEventListener(
        "change",
        updateProductType
    );


    updateProductType();


    // =========================================================
    // DIGITAL FILE
    // =========================================================

    digitalFile.addEventListener(
        "change",
        () => {

            const file =
                digitalFile.files[0];

            if (!file) {
                return;
            }

            console.log(
                "Fichye dijital chwazi:",
                file.name
            );
        }
    );


    // =========================================================
    // NON FICHYE
    // =========================================================

    function createFileName(file) {

        const extension =
            file.name.includes(".")
                ? file.name
                    .split(".")
                    .pop()
                    .toLowerCase()
                : "";

        const randomName =
            crypto.randomUUID();

        return extension
            ? randomName + "." + extension
            : randomName;
    }


    // =========================================================
    // USER
    // =========================================================

    async function getCurrentUser() {

        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (error) {

            console.error(
                "USER ERROR:",
                error
            );

            throw new Error(
                "Nou pa ka verifye kont ou."
            );
        }


        if (!data.user) {

            throw new Error(
                "Ou dwe konekte pou w pibliye yon pwodwi."
            );
        }


        return data.user;
    }


    // =========================================================
    // UPLOAD FOTO
    // =========================================================

    async function uploadImage(
        userId,
        file
    ) {

        const fileName =
            createFileName(file);


        const filePath =
            userId +
            "/" +
            fileName;


        const {
            error
        } =
            await supabase
                .storage
                .from(IMAGE_BUCKET)
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type
                    }
                );


        if (error) {

            console.error(
                "IMAGE ERROR:",
                error
            );

            throw new Error(
                "Foto pwodwi a pa t ka upload."
            );
        }


        const {
            data
        } =
            supabase
                .storage
                .from(IMAGE_BUCKET)
                .getPublicUrl(
                    filePath
                );


        return data.publicUrl;
    }


    // =========================================================
    // UPLOAD DIGITAL
    // =========================================================

    async function uploadDigital(
        userId,
        file
    ) {

        const fileName =
            createFileName(file);


        const filePath =
            userId +
            "/" +
            fileName;


        const {
            error
        } =
            await supabase
                .storage
                .from(DIGITAL_BUCKET)
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type
                    }
                );


        if (error) {

            console.error(
                "DIGITAL ERROR:",
                error
            );

            throw new Error(
                "Fichye dijital la pa t ka upload."
            );
        }


        // Bucket dijital la rete PRIVATE

        return filePath;
    }


    // =========================================================
    // SUBMIT
    // =========================================================

    productForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();


            // =================================================
            // TYPE
            // =================================================

            const type =
                productType.value;


            if (
                type !== "physical" &&
                type !== "digital" &&
                type !== "service"
            ) {

                showMessage(
                    "Tanpri chwazi kalite pwodwi a.",
                    "error"
                );

                return;
            }


            // =================================================
            // FOTO
            // =================================================

            const imageFile =
                productImage.files[0];


            if (!imageFile) {

                showMessage(
                    "Tanpri ajoute yon foto pwodwi.",
                    "error"
                );

                return;
            }


            // =================================================
            // DIGITAL FILE
            // =================================================

            const digitalFileData =
                digitalFile.files[0];


            if (
                type === "digital" &&
                !digitalFileData
            ) {

                showMessage(
                    "Tanpri ajoute fichye pwodwi dijital la.",
                    "error"
                );

                return;
            }


            // =================================================
            // STOCK
            // =================================================

            let stock = 0;


            if (type === "physical") {

                stock =
                    Number(
                        productStock.value
                    );


                if (
                    !Number.isInteger(stock) ||
                    stock < 0
                ) {

                    showMessage(
                        "Stock pwodwi fizik la pa valab.",
                        "error"
                    );

                    return;
                }
            }


            // =================================================
            // PRICE
            // =================================================

            const price =
                Number(
                    productPrice.value
                );


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showMessage(
                    "Pri pwodwi a pa valab.",
                    "error"
                );

                return;
            }


            // =================================================
            // LOADING
            // =================================================

            publishButton.disabled =
                true;

            publishButton.classList.add(
                "loading"
            );


            try {

                // =============================================
                // 1. USER
                // =============================================

                showMessage(
                    "Verifikasyon kont vandè a...",
                    "success"
                );


                const user =
                    await getCurrentUser();


                // =============================================
                // 2. UPLOAD FOTO
                // =============================================

                showMessage(
                    "Upload foto pwodwi a...",
                    "success"
                );


                const imageURL =
                    await uploadImage(
                        user.id,
                        imageFile
                    );


                // =============================================
                // 3. DIGITAL FILE
                // =============================================

                let digitalFilePath =
                    null;


                if (
                    type === "digital"
                ) {

                    showMessage(
                        "Upload fichye dijital la...",
                        "success"
                    );


                    digitalFilePath =
                        await uploadDigital(
                            user.id,
                            digitalFileData
                        );
                }


                // =============================================
                // 4. PRODUCT DATA
                // =============================================

                const productData = {

                    name:
                        productName.value.trim(),

                    description:
                        productDescription.value.trim(),

                    price:
                        price,

                    category:
                        productCategory.value,

                    seller_id:
                        user.id,

                    image_url:
                        imageURL,

                    product_type:
                        type,

                    digital_file_url:
                        digitalFilePath,

                    stock:
                        stock,

                    is_active:
                        true
                };


                console.log(
                    "PRODUCT DATA:",
                    productData
                );


                // =============================================
                // 5. INSERT SUPABASE
                // =============================================

                showMessage(
                    "Anrejistre pwodwi a...",
                    "success"
                );


                const {
                    data,
                    error
                } =
                    await supabase
                        .from("products")
                        .insert(
                            productData
                        )
                        .select()
                        .single();


                if (error) {

                    console.error(
                        "PRODUCT INSERT ERROR:",
                        error
                    );

                    throw new Error(
                        "Pwodwi a pa t ka anrejistre: " +
                        error.message
                    );
                }


                console.log(
                    "PRODUCT CREATED:",
                    data
                );


                // =============================================
                // 6. SUCCESS
                // =============================================

                showMessage(
                    "🎉 Pwodwi a pibliye avèk siksè!",
                    "success"
                );


                // =============================================
                // 7. RESET
                // =============================================

                productForm.reset();

                updateProductType();

                imagePreview.src = "";

                imagePreview.style.display =
                    "none";

                imagePlaceholder.style.display =
                    "flex";


                // =============================================
                // 8. DASHBOARD
                // =============================================

                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    1800
                );


            } catch (error) {

                console.error(
                    "PUBLISH ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Yon erè rive. Eseye ankò.",
                    "error"
                );


            } finally {

                publishButton.disabled =
                    false;

                publishButton.classList.remove(
                    "loading"
                );
            }
        }
    );

});
