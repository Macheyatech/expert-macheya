document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // ELEMENTS
    // ==============================

    const productForm = document.getElementById("productForm");

    const productImage = document.getElementById("productImage");
    const chooseImageButton = document.getElementById("chooseImageButton");
    const imageUpload = document.getElementById("imageUpload");

    const imagePreview = document.getElementById("imagePreview");
    const imagePlaceholder = document.getElementById("imagePlaceholder");
    const imageError = document.getElementById("imageError");

    const productType = document.getElementById("productType");
    const digitalFileSection = document.getElementById("digitalFileSection");
    const digitalFile = document.getElementById("digitalFile");

    const formMessage = document.getElementById("formMessage");
    const publishButton = document.getElementById("publishButton");


    // ==============================
    // CHWAZI FOTO
    // ==============================

    chooseImageButton.addEventListener("click", (event) => {

        event.preventDefault();

        productImage.click();

    });


    // Lè itilizatè a klike dirèkteman
    // sou bwat foto a

    imageUpload.addEventListener("click", () => {

        productImage.click();

    });


    // ==============================
    // FOTO CHWAZI
    // ==============================

    productImage.addEventListener("change", () => {

        const file = productImage.files[0];

        imageError.textContent = "";

        if (!file) {
            return;
        }


        // Verifye kalite fichye a

        if (!file.type.startsWith("image/")) {

            imageError.textContent =
                "Tanpri chwazi yon fichye imaj.";

            productImage.value = "";

            return;
        }


        // Kreye preview

        const imageURL = URL.createObjectURL(file);

        imagePreview.src = imageURL;

        imagePreview.style.display = "block";

        imagePlaceholder.style.display = "none";

    });


    // ==============================
    // PWODWI FIZIK / DIJITAL / SÈVIS
    // ==============================

    function updateProductType() {

        const type = productType.value;


        if (type === "digital") {

            // Montre fichye dijital la

            digitalFileSection.style.display = "block";

            digitalFile.required = true;

        } else {

            // Kache l pou fizik/sèvis

            digitalFileSection.style.display = "none";

            digitalFile.required = false;

            digitalFile.value = "";

        }

    }


    // Lè kalite pwodwi chanje

    productType.addEventListener(
        "change",
        updateProductType
    );


    // Verifye depi paj la ouvri

    updateProductType();


    // ==============================
    // FICHYE DIJITAL CHWAZI
    // ==============================

    digitalFile.addEventListener("change", () => {

        const file = digitalFile.files[0];

        if (!file) {
            return;
        }

        console.log(
            "Fichye dijital chwazi:",
            file.name
        );

    });


    // ==============================
    // MESSAGE
    // ==============================

    function showMessage(message, type) {

        formMessage.textContent = message;

        formMessage.className =
            "form-message " + type;

        formMessage.style.display = "block";

    }


    // ==============================
    // SUBMIT
    // ==============================

    productForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const imageFile =
            productImage.files[0];

        const digitalFileData =
            digitalFile.files[0];


        // ------------------------------
        // Verifye foto
        // ------------------------------

        if (!imageFile) {

            showMessage(
                "Tanpri ajoute yon foto pwodwi.",
                "error"
            );

            return;
        }


        // ------------------------------
        // Verifye fichye dijital
        // ------------------------------

        if (
            productType.value === "digital" &&
            !digitalFileData
        ) {

            showMessage(
                "Tanpri ajoute fichye pwodwi dijital la.",
                "error"
            );

            return;
        }


        // ------------------------------
        // Loading
        // ------------------------------

        publishButton.disabled = true;

        publishButton.classList.add("loading");


        try {

            /*
             * ==========================================
             * POU MOMAN AN NOU VERIFYE FRONT-END LAN
             * ==========================================
             *
             * Apre nou konfime foto ak fichye yo chwazi
             * byen, n ap konekte upload yo ak Supabase.
             */

            console.log(
                "Foto:",
                imageFile.name
            );


            if (digitalFileData) {

                console.log(
                    "Fichye dijital:",
                    digitalFileData.name
                );

            }


            showMessage(
                "Foto ak fichye a pare. Sistèm upload Supabase la se pwochen etap la.",
                "success"
            );


        } catch (error) {

            console.error(error);

            showMessage(
                "Yon erè rive. Eseye ankò.",
                "error"
            );

        } finally {

            publishButton.disabled = false;

            publishButton.classList.remove("loading");

        }

    });

});
