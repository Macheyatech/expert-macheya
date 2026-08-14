/* =========================================================
   MACHEYA
   ADD PRODUCT SYSTEM
   Physical + Digital + Service
========================================================= */


/* =========================================================
   1. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
    "METE_URL_SUPABASE_OU_LA";

const SUPABASE_ANON_KEY =
    "METE_ANON_PUBLISHABLE_KEY_OU_LA";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =========================================================
   2. STORAGE BUCKETS
========================================================= */

/*
   Non teknik bucket yo.
*/

const IMAGE_BUCKET =
    "product-images";

const DIGITAL_BUCKET =
    "digital-products";


/* =========================================================
   3. LIMITS
========================================================= */

const MAX_IMAGE_SIZE =
    5 * 1024 * 1024; // 5 MB

const MAX_DIGITAL_SIZE =
    100 * 1024 * 1024; // 100 MB


/* =========================================================
   4. DOM ELEMENTS
========================================================= */

const productForm =
    document.getElementById("productForm");

const imageUpload =
    document.getElementById("imageUpload");

const productImage =
    document.getElementById("productImage");

const chooseImageButton =
    document.getElementById("chooseImageButton");

const imagePlaceholder =
    document.getElementById("imagePlaceholder");

const imagePreview =
    document.getElementById("imagePreview");

const imageError =
    document.getElementById("imageError");

const productType =
    document.getElementById("productType");

const digitalFileSection =
    document.getElementById("digitalFileSection");

const digitalFile =
    document.getElementById("digitalFile");

const digitalFileError =
    document.getElementById("digitalFileError");

const formMessage =
    document.getElementById("formMessage");

const publishButton =
    document.getElementById("publishButton");


/* =========================================================
   5. OPEN IMAGE PICKER
========================================================= */

function openImagePicker() {

    if (productImage) {

        productImage.click();

    }

}


if (imageUpload) {

    imageUpload.addEventListener(
        "click",
        openImagePicker
    );

}


if (chooseImageButton) {

    chooseImageButton.addEventListener(
        "click",
        openImagePicker
    );

}


/* =========================================================
   6. IMAGE PREVIEW
========================================================= */

if (productImage) {

    productImage.addEventListener(
        "change",
        function () {

            imageError.textContent = "";


            const file =
                this.files[0];


            if (!file) {

                return;

            }


            if (!file.type.startsWith("image/")) {

                imageError.textContent =
                    "Tanpri chwazi yon imaj ki valab.";

                this.value = "";

                return;

            }


            if (file.size > MAX_IMAGE_SIZE) {

                imageError.textContent =
                    "Foto a pa dwe depase 5 MB.";

                this.value = "";

                return;

            }


            const objectURL =
                URL.createObjectURL(file);


            imagePreview.src =
                objectURL;


            imagePreview.style.display =
                "block";


            imagePlaceholder.style.display =
                "none";

        }
    );

}


/* =========================================================
   7. PRODUCT TYPE
========================================================= */

if (productType) {

    productType.addEventListener(
        "change",
        function () {

            const selectedType =
                this.value;


            if (selectedType === "digital") {

                digitalFileSection.style.display =
                    "block";


                digitalFile.required =
                    true;

            } else {

                digitalFileSection.style.display =
                    "none";


                digitalFile.required =
                    false;


                digitalFile.value =
                    "";


                digitalFileError.textContent =
                    "";

            }

        }
    );

}


/* =========================================================
   8. MESSAGE FUNCTIONS
========================================================= */

function showMessage(
    message,
    type
) {

    formMessage.textContent =
        message;


    formMessage.className =
        "form-message " + type;


    formMessage.style.display =
        "block";

}


function hideMessage() {

    formMessage.textContent =
        "";

    formMessage.style.display =
        "none";

}


/* =========================================================
   9. LOADING
========================================================= */

function setLoading(
    loading
) {

    publishButton.disabled =
        loading;


    if (loading) {

        publishButton.classList.add(
            "loading"
        );

    } else {

        publishButton.classList.remove(
            "loading"
        );

    }

}


/* =========================================================
   10. UNIQUE FILE NAME
========================================================= */

function createFilePath(
    userId,
    file
) {

    const extension =
        file.name.includes(".")
            ? file.name
                .split(".")
                .pop()
                .toLowerCase()
            : "";


    const randomName =
        crypto.randomUUID();


    if (extension) {

        return (
            userId +
            "/" +
            randomName +
            "." +
            extension
        );

    }


    return (
        userId +
        "/" +
        randomName
    );

}


/* =========================================================
   11. UPLOAD IMAGE
========================================================= */

async function uploadProductImage(
    userId,
    file
) {

    const filePath =
        createFilePath(
            userId,
            file
        );


    const {
        error
    } = await supabaseClient.storage
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

        throw new Error(
            "Foto a pa t ka upload: " +
            error.message
        );

    }


    const {
        data
    } = supabaseClient.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(
            filePath
        );


    return {

        path: filePath,

        url: data.publicUrl

    };

}


/* =========================================================
   12. UPLOAD DIGITAL FILE
========================================================= */

async function uploadDigitalFile(
    userId,
    file
) {

    const filePath =
        createFilePath(
            userId,
            file
        );


    const {
        error
    } = await supabaseClient.storage
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

        throw new Error(
            "Fichye dijital la pa t ka upload: " +
            error.message
        );

    }


    /*
       IMPORTANT:

       Pa itilize getPublicUrl()
       pou bucket sa a.

       Bucket la prive.

       Nou sèlman mete PATH la
       nan database la.
    */

    return {

        path: filePath

    };

}


/* =========================================================
   13. DELETE STORAGE FILE
========================================================= */

async function deleteStorageFile(
    bucket,
    path
) {

    if (!path) {

        return;

    }


    const {
        error
    } = await supabaseClient.storage
        .from(bucket)
        .remove([
            path
        ]);


    if (error) {

        console.warn(
            "Netwayaj fichye echwe:",
            error.message
        );

    }

}


/* =========================================================
   14. GET CURRENT USER
========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabaseClient.auth
        .getUser();


    if (error) {

        throw new Error(
            "Nou pa ka verifye kont ou."
        );

    }


    if (!data.user) {

        throw new Error(
            "Ou dwe konekte pou ajoute yon pwodwi."
        );

    }


    return data.user;

}


/* =========================================================
   15. VALIDATE FORM
========================================================= */

function validateForm() {

    const name =
        document
            .getElementById("productName")
            .value
            .trim();


    const price =
        Number(
            document
                .getElementById("productPrice")
                .value
        );


    const stock =
        Number(
            document
                .getElementById("productStock")
                .value
        );


    const category =
        document
            .getElementById("productCategory")
            .value;


    const type =
        productType.value;


    const description =
        document
            .getElementById(
                "productDescription"
            )
            .value
            .trim();


    if (!name) {

        throw new Error(
            "Tanpri mete non pwodwi a."
        );

    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        throw new Error(
            "Tanpri mete yon pri ki valab."
        );

    }


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        throw new Error(
            "Stock la dwe yon kantite antye."
        );

    }


    if (!category) {

        throw new Error(
            "Tanpri chwazi kategori a."
        );

    }


    if (!type) {

        throw new Error(
            "Tanpri chwazi kalite pwodwi a."
        );

    }


    if (!description) {

        throw new Error(
            "Tanpri mete yon deskripsyon."
        );

    }


    const imageFile =
        productImage.files[0] ||
        null;


    if (imageFile) {

        if (
            !imageFile.type.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                "Foto pwodwi a pa valab."
            );

        }


        if (
            imageFile.size >
            MAX_IMAGE_SIZE
        ) {

            throw new Error(
                "Foto pwodwi a pa dwe depase 5 MB."
            );

        }

    }


    const digitalProductFile =
        digitalFile.files[0] ||
        null;


    if (type === "digital") {

        if (!digitalProductFile) {

            throw new Error(
                "Pou yon pwodwi dijital, ou dwe chwazi fichye pwodwi a."
            );

        }


        if (
            digitalProductFile.size >
            MAX_DIGITAL_SIZE
        ) {

            throw new Error(
                "Fichye dijital la pa dwe depase 100 MB."
            );

        }

    }


    return {

        name,

        price,

        stock,

        category,

        type,

        description,

        imageFile,

        digitalProductFile

    };

}


/* =========================================================
   16. RESET FORM
========================================================= */

function resetProductForm() {

    productForm.reset();


    imagePreview.src =
        "";


    imagePreview.style.display =
        "none";


    imagePlaceholder.style.display =
        "flex";


    digitalFileSection.style.display =
        "none";


    digitalFile.required =
        false;


    imageError.textContent =
        "";


    digitalFileError.textContent =
        "";

}


/* =========================================================
   17. SUBMIT
========================================================= */

productForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        hideMessage();


        setLoading(true);


        let uploadedImagePath =
            null;


        let uploadedDigitalPath =
            null;


        try {

            /* -----------------------------------------
               USER
            ----------------------------------------- */

            const user =
                await getCurrentUser();


            /* -----------------------------------------
               FORM
            ----------------------------------------- */

            const form =
                validateForm();


            /* -----------------------------------------
               IMAGE
            ----------------------------------------- */

            let imageURL =
                null;


            if (form.imageFile) {

                const imageResult =
                    await uploadProductImage(
                        user.id,
                        form.imageFile
                    );


                uploadedImagePath =
                    imageResult.path;


                imageURL =
                    imageResult.url;

            }


            /* -----------------------------------------
               DIGITAL FILE
            ----------------------------------------- */

            if (
                form.type === "digital" &&
                form.digitalProductFile
            ) {

                const digitalResult =
                    await uploadDigitalFile(
                        user.id,
                        form.digitalProductFile
                    );


                uploadedDigitalPath =
                    digitalResult.path;

            }


            /* -----------------------------------------
               DATABASE
            ----------------------------------------- */

            const {
                data: product,
                error: productError
            } = await supabaseClient
                .from("products")
                .insert({

                    seller_id:
                        user.id,

                    name:
                        form.name,

                    description:
                        form.description,

                    price:
                        form.price,

                    category:
                        form.category,

                    image_url:
                        imageURL,

                    product_type:
                        form.type,

                    digital_file_url:
                        uploadedDigitalPath,

                    stock:
                        form.stock,

                    is_active:
                        true

                })
                .select()
                .single();


            if (productError) {

                throw new Error(
                    "Pwodwi a pa t ka anrejistre: " +
                    productError.message
                );

            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            console.log(
                "MACHEYA PRODUCT CREATED:",
                product
            );


            showMessage(
                "🎉 Pwodwi a pibliye avèk siksè!",
                "success"
            );


            resetProductForm();


        } catch (error) {

            console.error(
                "MACHEYA ADD PRODUCT ERROR:",
                error
            );


            /*
               Si database la echwe apre upload,
               efase fichye yo pou pa kite
               fichye òfelen nan Storage.
            */

            if (uploadedImagePath) {

                await deleteStorageFile(
                    IMAGE_BUCKET,
                    uploadedImagePath
                );

            }


            if (uploadedDigitalPath) {

                await deleteStorageFile(
                    DIGITAL_BUCKET,
                    uploadedDigitalPath
                );

            }


            showMessage(
                error.message ||
                "Yon erè rive. Tanpri eseye ankò.",
                "error"
            );


        } finally {

            setLoading(false);

        }

    }
);
