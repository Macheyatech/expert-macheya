/* =========================================================
   MACHEYA — ADD PRODUCT
   Supabase + Product Image Upload
========================================================= */

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";

const PRODUCT_BUCKET = "product-images";

let supabaseClient = null;
let selectedImage = null;


/* =========================================================
   LOAD SUPABASE
========================================================= */

async function loadSupabase() {

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        return;
    }

    try {

        const module = await import(
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
        );

        supabaseClient = module.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    } catch (error) {

        console.error(
            "Supabase pa t ka chaje:",
            error
        );

        showMessage(
            "Nou pa kapab konekte ak sistèm nan. Verifye koneksyon entènèt la.",
            "error"
        );

        throw error;
    }
}


/* =========================================================
   ELEMENTS
========================================================= */

const productForm =
    document.getElementById("productForm");

const productImage =
    document.getElementById("productImage");

const imageUpload =
    document.getElementById("imageUpload");

const imagePlaceholder =
    document.getElementById("imagePlaceholder");

const imagePreview =
    document.getElementById("imagePreview");

const chooseImageButton =
    document.getElementById("chooseImageButton");

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


/* =========================================================
   IMAGE PICKER
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
   IMAGE SELECTED
========================================================= */

if (productImage) {

    productImage.addEventListener(
        "change",
        function () {

            clearImageError();

            const file =
                productImage.files[0];

            if (!file) {
                return;
            }


            /* Verify image type */

            if (!file.type.startsWith("image/")) {

                showImageError(
                    "Tanpri chwazi yon fichye imaj."
                );

                productImage.value = "";

                return;
            }


            /* Maximum 5 MB */

            const maxSize =
                5 * 1024 * 1024;

            if (file.size > maxSize) {

                showImageError(
                    "Foto a twò lou. Li dwe pi piti pase 5 MB."
                );

                productImage.value = "";

                return;
            }


            selectedImage = file;


            /* Preview */

            const reader =
                new FileReader();

            reader.onload = function (event) {

                imagePreview.src =
                    event.target.result;

                imagePreview.style.display =
                    "block";

                imagePlaceholder.style.display =
                    "none";

            };

            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   PRODUCT TYPE
========================================================= */

if (productType) {

    productType.addEventListener(
        "change",
        function () {

            if (
                productType.value === "digital"
            ) {

                digitalFileSection.style.display =
                    "block";

            } else {

                digitalFileSection.style.display =
                    "none";

                if (digitalFile) {
                    digitalFile.value = "";
                }

            }

        }
    );

}


/* =========================================================
   MESSAGES
========================================================= */

function showMessage(
    message,
    type = "error"
) {

    if (!formMessage) {
        return;
    }

    formMessage.textContent =
        message;

    formMessage.className =
        "form-message " + type;

    formMessage.style.display =
        "block";

}


function hideMessage() {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = "";

    formMessage.style.display =
        "none";

}


function showImageError(message) {

    if (!imageError) {
        return;
    }

    imageError.textContent =
        message;

}


function clearImageError() {

    if (!imageError) {
        return;
    }

    imageError.textContent = "";

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setLoading(
    loading
) {

    if (!publishButton) {
        return;
    }

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

        publishButton.textContent =
            "Pibliye pwodwi";
    }

}


/* =========================================================
   GET FILE EXTENSION
========================================================= */

function getFileExtension(file) {

    if (!file || !file.name) {
        return "jpg";
    }

    const parts =
        file.name.split(".");

    if (parts.length < 2) {
        return "jpg";
    }

    return parts[
        parts.length - 1
    ].toLowerCase();

}


/* =========================================================
   UPLOAD PRODUCT IMAGE
========================================================= */

async function uploadProductImage(
    userId,
    file
) {

    const extension =
        getFileExtension(file);

    const fileName =
        `${crypto.randomUUID()}.${extension}`;

    const filePath =
        `${userId}/${fileName}`;


    const {
        error: uploadError
    } =
        await supabaseClient
            .storage
            .from(PRODUCT_BUCKET)
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                }
            );


    if (uploadError) {

        console.error(
            "Upload image error:",
            uploadError
        );

        throw new Error(
            "Nou pa kapab mete foto pwodwi a sou sèvè a."
        );

    }


    /* Get public URL */

    const {
        data
    } =
        supabaseClient
            .storage
            .from(PRODUCT_BUCKET)
            .getPublicUrl(
                filePath
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "Nou pa kapab jwenn URL foto pwodwi a."
        );

    }


    return data.publicUrl;
}


/* =========================================================
   UPLOAD DIGITAL FILE
========================================================= */

async function uploadDigitalFile(
    userId,
    file
) {

    if (!file) {
        return null;
    }


    const extension =
        getFileExtension(file);

    const fileName =
        `${crypto.randomUUID()}.${extension}`;

    const filePath =
        `${userId}/digital/${fileName}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(PRODUCT_BUCKET)
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
            "Digital file upload error:",
            error
        );

        throw new Error(
            "Nou pa kapab mete fichye dijital la."
        );

    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from(PRODUCT_BUCKET)
            .getPublicUrl(
                filePath
            );


    return data.publicUrl;
}


/* =========================================================
   SUBMIT PRODUCT
========================================================= */

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideMessage();
            clearImageError();


            try {

                setLoading(true);


                /* =========================================
                   CHECK SUPABASE
                ========================================= */

                if (!supabaseClient) {

                    await loadSupabase();

                }


                /* =========================================
                   GET CURRENT USER
                ========================================= */

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (sessionError) {

                    console.error(
                        sessionError
                    );

                    throw new Error(
                        "Nou pa kapab verifye kont ou."
                    );

                }


                const session =
                    sessionData.session;


                if (!session) {

                    throw new Error(
                        "Ou dwe konekte kòm vandè pou ajoute yon pwodwi."
                    );

                }


                const user =
                    session.user;


                /* =========================================
                   CHECK IMAGE
                ========================================= */

                if (!selectedImage) {

                    showImageError(
                        "Tanpri chwazi yon foto pou pwodwi a."
                    );

                    throw new Error(
                        "Foto pwodwi a obligatwa."
                    );

                }


                /* =========================================
                   GET FORM VALUES
                ========================================= */

                const name =
                    productName.value.trim();

                const description =
                    productDescription.value.trim();

                const category =
                    productCategory.value;

                const type =
                    productType.value;

                const price =
                    Number(
                        productPrice.value
                    );

                const stock =
                    Number(
                        productStock.value
                    );


                /* =========================================
                   VALIDATION
                ========================================= */

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
                        "Tanpri mete yon stock ki valab."
                    );

                }


                if (!category) {

                    throw new Error(
                        "Tanpri chwazi kategori pwodwi a."
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


                /* =========================================
                   UPLOAD IMAGE
                ========================================= */

                const imageUrl =
                    await uploadProductImage(
                        user.id,
                        selectedImage
                    );


                /* =========================================
                   DIGITAL FILE
                ========================================= */

                let digitalFileUrl = null;


                if (
                    type === "digital" &&
                    digitalFile &&
                    digitalFile.files.length > 0
                ) {

                    digitalFileUrl =
                        await uploadDigitalFile(
                            user.id,
                            digitalFile.files[0]
                        );

                }


                /* =========================================
                   INSERT PRODUCT
                ========================================= */

                const productData = {

                    seller_id:
                        user.id,

                    name:
                        name,

                    description:
                        description,

                    price:
                        price,

                    category:
                        category,

                    image_url:
                        imageUrl,

                    product_type:
                        type,

                    digital_file_url:
                        digitalFileUrl,

                    stock:
                        stock,

                    is_active:
                        true

                };


                console.log(
                    "Product data:",
                    productData
                );


                const {
                    data: insertedProduct,
                    error: insertError
                } =
                    await supabaseClient
                        .from("products")
                        .insert(
                            productData
                        )
                        .select()
                        .single();


                if (insertError) {

                    console.error(
                        "Product insert error:",
                        insertError
                    );

                    throw new Error(
                        "Nou pa kapab anrejistre pwodwi a nan baz done a."
                    );

                }


                console.log(
                    "Product created:",
                    insertedProduct
                );


                /* =========================================
                   SUCCESS
                ========================================= */

                showMessage(
                    "🎉 Pwodwi a pibliye avèk siksè!",
                    "success"
                );


                /* Reset form */

                productForm.reset();

                selectedImage = null;

                imagePreview.src = "";

                imagePreview.style.display =
                    "none";

                imagePlaceholder.style.display =
                    "flex";

                digitalFileSection.style.display =
                    "none";


                /*
                   Apre yon ti moman,
                   voye vandè a nan seller.html
                */

                setTimeout(
                    function () {

                        window.location.href =
                            "seller.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "ADD PRODUCT ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Yon erè rive pandan piblikasyon pwodwi a.",
                    "error"
                );


            } finally {

                setLoading(false);

            }

        }
    );

}


/* =========================================================
   START
========================================================= */

loadSupabase()
    .catch(
        function (error) {

            console.error(
                "Initialisation error:",
                error
            );

        }
    );
