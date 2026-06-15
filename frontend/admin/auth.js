// Jika sudah login, langsung arahkan ke dashboard
if (localStorage.getItem("admin_token")) {
    window.location.href = "dashboard.html";
}

const loginForm = document.getElementById("login-form");
const errorMsg = document.getElementById("error-msg");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    errorMsg.style.display = "none";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMsg.textContent = data.message || "Login gagal.";
            errorMsg.style.display = "block";
            return;
        }

        // Simpan token & info admin di localStorage
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_username", data.admin.username);

        window.location.href = "dashboard.html";
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Tidak dapat terhubung ke server. Pastikan backend berjalan.";
        errorMsg.style.display = "block";
    }
});
