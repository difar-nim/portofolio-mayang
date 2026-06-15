// =============================================
// Cek autentikasi
// =============================================
const token = localStorage.getItem("admin_token");
const username = localStorage.getItem("admin_username");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("welcome-text").textContent = `Halo, ${username || "Admin"}`;

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    window.location.href = "login.html";
});

// =============================================
// Elemen DOM
// =============================================
const form = document.getElementById("tugas-form");
const formTitle = document.getElementById("form-title");
const idInput = document.getElementById("tugas-id");
const judulInput = document.getElementById("judul");
const deskripsiInput = document.getElementById("deskripsi");
const tanggalInput = document.getElementById("tanggal");
const fileInput = document.getElementById("file");
const currentFileDiv = document.getElementById("current-file");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-edit-btn");
const tableBody = document.getElementById("tugas-table-body");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

// =============================================
// Helper untuk menampilkan pesan
// =============================================
function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
    setTimeout(() => (errorMsg.style.display = "none"), 4000);
}

function showSuccess(msg) {
    successMsg.textContent = msg;
    successMsg.style.display = "block";
    errorMsg.style.display = "none";
    setTimeout(() => (successMsg.style.display = "none"), 3000);
}

// Jika token expired/invalid, lempar ke login
function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_username");
        window.location.href = "login.html";
        return true;
    }
    return false;
}

// =============================================
// Memuat daftar tugas
// =============================================
async function loadTugasTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/tugas`);
        const data = await response.json();

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">Belum ada tugas.</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";

        data.forEach(tugas => {
            const tanggalFormat = new Date(tugas.tanggal).toLocaleDateString("id-ID", {
                day: "numeric", month: "short", year: "numeric"
            });

            const fileCell = tugas.file
                ? `<a href="${UPLOAD_BASE_URL}/${tugas.file}" target="_blank">${tugas.file}</a>`
                : "-";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${tugas.id}</td>
                <td>${tugas.judul}</td>
                <td>${tanggalFormat}</td>
                <td>${fileCell}</td>
                <td class="actions">
                    <button class="btn btn-sm edit-btn" data-id="${tugas.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${tugas.id}">Hapus</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Pasang event listener untuk tombol edit & hapus
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", () => editTugas(btn.dataset.id, data));
        });
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteTugas(btn.dataset.id));
        });
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="5">Gagal memuat data. Pastikan backend berjalan.</td></tr>`;
    }
}

// =============================================
// Tambah / Edit Tugas (Submit Form)
// =============================================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("judul", judulInput.value);
    formData.append("deskripsi", deskripsiInput.value);
    formData.append("tanggal", tanggalInput.value);

    if (fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
    }

    const id = idInput.value;
    const isEdit = !!id;

    const url = isEdit ? `${API_BASE_URL}/tugas/${id}` : `${API_BASE_URL}/tugas`;
    const method = isEdit ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (handleAuthError(response)) return;

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || "Gagal menyimpan tugas.");
            return;
        }

        showSuccess(isEdit ? "Tugas berhasil diperbarui." : "Tugas berhasil ditambahkan.");
        resetForm();
        loadTugasTable();
    } catch (err) {
        console.error(err);
        showError("Tidak dapat terhubung ke server.");
    }
});

// =============================================
// Edit Tugas - isi form dengan data yang dipilih
// =============================================
function editTugas(id, data) {
    const tugas = data.find(t => t.id == id);
    if (!tugas) return;

    formTitle.textContent = "Edit Tugas";
    idInput.value = tugas.id;
    judulInput.value = tugas.judul;
    deskripsiInput.value = tugas.deskripsi || "";
    tanggalInput.value = tugas.tanggal.split("T")[0];

    currentFileDiv.innerHTML = tugas.file
        ? `<span class="current-file">File saat ini: ${tugas.file}</span>`
        : "";

    submitBtn.textContent = "Update Tugas";
    cancelBtn.style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// =============================================
// Hapus Tugas
// =============================================
async function deleteTugas(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tugas/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (handleAuthError(response)) return;

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || "Gagal menghapus tugas.");
            return;
        }

        showSuccess("Tugas berhasil dihapus.");
        loadTugasTable();
    } catch (err) {
        console.error(err);
        showError("Tidak dapat terhubung ke server.");
    }
}

// =============================================
// Reset Form
// =============================================
function resetForm() {
    form.reset();
    idInput.value = "";
    formTitle.textContent = "Tambah Tugas Baru";
    submitBtn.textContent = "Simpan Tugas";
    cancelBtn.style.display = "none";
    currentFileDiv.innerHTML = "";
}

cancelBtn.addEventListener("click", resetForm);

// Muat data saat halaman dibuka
loadTugasTable();
