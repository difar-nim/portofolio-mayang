const token = localStorage.getItem("admin_token");
const username = localStorage.getItem("admin_username");
if (!token) window.location.href = "login.html";

document.getElementById("welcome-text").textContent = `Halo, ${username || "Admin"} 👋`;

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    window.location.href = "login.html";
});

const form = document.getElementById("tugas-form");
const formTitle = document.getElementById("form-title");
const idInput = document.getElementById("tugas-id");
const judulInput = document.getElementById("judul");
const deskripsiInput = document.getElementById("deskripsi");
const tanggalInput = document.getElementById("tanggal");
const fileInput = document.getElementById("file");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-edit-btn");
const tableBody = document.getElementById("tugas-table-body");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
    setTimeout(() => errorMsg.style.display = "none", 4000);
}

function showSuccess(msg) {
    successMsg.textContent = msg;
    successMsg.style.display = "block";
    errorMsg.style.display = "none";
    setTimeout(() => successMsg.style.display = "none", 3000);
}

function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_username");
        window.location.href = "login.html";
        return true;
    }
    return false;
}

// Konversi link Google Drive ke format view
function getDriveViewUrl(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/view`;
    return url;
}

async function loadTugasTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/tugas`);
        const data = await response.json();

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;">Belum ada tugas.</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";
        data.forEach(tugas => {
            const tanggalFormat = new Date(tugas.tanggal).toLocaleDateString("id-ID", {
                day: "numeric", month: "short", year: "numeric"
            });

            const driveUrl = getDriveViewUrl(tugas.file);
            const fileCell = driveUrl
                ? `<a href="${driveUrl}" target="_blank" style="color:#1a73e8;">📄 Lihat File</a>`
                : "-";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${tugas.id}</td>
                <td>${tugas.judul}</td>
                <td>${tanggalFormat}</td>
                <td>${fileCell}</td>
                <td class="actions">
                    <button class="btn btn-sm edit-btn" data-id="${tugas.id}">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${tugas.id}">🗑️ Hapus</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll(".edit-btn").forEach(btn =>
            btn.addEventListener("click", () => editTugas(btn.dataset.id, data))
        );
        document.querySelectorAll(".delete-btn").forEach(btn =>
            btn.addEventListener("click", () => deleteTugas(btn.dataset.id))
        );
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="5">Gagal memuat data.</td></tr>`;
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = idInput.value;
    const isEdit = !!id;

    const body = {
        judul: judulInput.value.trim(),
        deskripsi: deskripsiInput.value.trim(),
        tanggal: tanggalInput.value,
        file: fileInput.value.trim() || null
    };

    const url = isEdit ? `${API_BASE_URL}/tugas/${id}` : `${API_BASE_URL}/tugas`;
    const method = isEdit ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) { showError(data.message || "Gagal menyimpan."); return; }
        showSuccess(isEdit ? "✅ Tugas berhasil diperbarui." : "✅ Tugas berhasil ditambahkan.");
        resetForm();
        loadTugasTable();
    } catch (err) {
        showError("Tidak dapat terhubung ke server.");
    }
});

function editTugas(id, data) {
    const tugas = data.find(t => t.id == id);
    if (!tugas) return;
    formTitle.textContent = "✏️ Edit Tugas";
    idInput.value = tugas.id;
    judulInput.value = tugas.judul;
    deskripsiInput.value = tugas.deskripsi || "";
    tanggalInput.value = tugas.tanggal.split("T")[0];
    fileInput.value = tugas.file || "";
    submitBtn.textContent = "💾 Update Tugas";
    cancelBtn.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteTugas(id) {
    if (!confirm("Hapus tugas ini?")) return;
    try {
        const response = await fetch(`${API_BASE_URL}/tugas/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) { showError(data.message || "Gagal menghapus."); return; }
        showSuccess("🗑️ Tugas berhasil dihapus.");
        loadTugasTable();
    } catch (err) {
        showError("Tidak dapat terhubung ke server.");
    }
}

function resetForm() {
    form.reset();
    idInput.value = "";
    formTitle.textContent = "Tambah Tugas Baru";
    submitBtn.textContent = "💾 Simpan Tugas";
    cancelBtn.style.display = "none";
}

cancelBtn.addEventListener("click", resetForm);
loadTugasTable();
