document.addEventListener("DOMContentLoaded", () => {

  const signupForm = document.getElementById("signupForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

  const message = document.getElementById("signupMessage");
  const signupButton = document.getElementById("signupButton");

  // Montre / kache modpas
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "🙈" : "👁️";
    });
  }

  // Montre / kache konfimasyon modpas
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", () => {
      const isPassword = confirmPasswordInput.type === "password";

      confirmPasswordInput.type = isPassword ? "text" : "password";
      toggleConfirmPassword.textContent = isPassword ? "🙈" : "👁️";
    });
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
  }

  function clearMessage() {
    message.textContent = "";
    message.className = "message";
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessage();

    const nom = document.getElementById("nom").value.trim();
    const email = document.getElementById("email").value.trim();
    const telephone =
      document.getElementById("telephone").value.trim();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const role = document.getElementById("role").value;

    if (!nom || !email || !telephone || !password || !role) {
      showMessage("Tanpri ranpli tout chan yo.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage(
        "Modpas la dwe gen omwen 6 karaktè.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage(
        "De modpas yo pa menm.",
        "error"
      );
      return;
    }

    if (role !== "acheteur" && role !== "vendeur") {
      showMessage(
        "Tanpri chwazi yon kalite kont.",
        "error"
      );
      return;
    }

    signupButton.disabled = true;
    signupButton.textContent = "Kreyasyon kont...";

      try {

      /*
       * Supabase Auth ap vini isit la.
       *
       * Nou pral konekte:
       * 1. Supabase Auth
       * 2. public.profiles
       * 3. role = acheteur / vendeur
       */

      showMessage(
        "Kont lan pare pou koneksyon ak Supabase.",
        "success"
      );

    } catch (error) {

      console.error(error);

      showMessage(
        "Yon erè rive pandan kreyasyon kont lan.",
        "error"
      );

    } finally {

      signupButton.disabled = false;
      signupButton.textContent = "Kreye Kont";

    }

  });

});
