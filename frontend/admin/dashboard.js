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
const currentFileDiv = document.getElementById("current-file");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-edit-btn");
const tableBody = document.getElementById("tugas-table-body");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");
const uploadProgress = document.getElementById("upload-progress");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
    setTimeout(() => errorMsg.style.display = "none", 5000);
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

            const fileCell = tugas.file
                ? `<a href="${tugas.file}" target="_blank" style="color:#1a73e8;">📄 ${tugas.file_name || 'Lihat File'}</a>`
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

    const formData = new FormData();
    formData.append("judul", judulInput.value.trim());
    formData.append("deskripsi", deskripsiInput.value.trim());
    formData.append("tanggal", tanggalInput.value);
    if (fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
    }

    const url = isEdit ? `${API_BASE_URL}/tugas/${id}` : `${API_BASE_URL}/tugas`;
    const method = isEdit ? "PUT" : "POST";

    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Mengupload...";
    if (fileInput.files[0]) {
        uploadProgress.style.display = "block";
        progressBar.style.width = "30%";
        progressText.textContent = "Mengupload file ke Google Drive...";
    }

    try {
        const response = await fetch(url, {
            method,
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        progressBar.style.width = "100%";
        progressText.textContent = "Selesai!";

        if (handleAuthError(response)) return;
        const data = await response.json();

        if (!response.ok) {
            showError(data.message || "Gagal menyimpan.");
            return;
        }

        showSuccess(isEdit ? "✅ Tugas berhasil diperbarui." : "✅ Tugas berhasil ditambahkan.");
        resetForm();
        loadTugasTable();
    } catch (err) {
        showError("Tidak dapat terhubung ke server.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? "💾 Update Tugas" : "💾 Simpan Tugas";
        setTimeout(() => {
            uploadProgress.style.display = "none";
            progressBar.style.width = "0%";
        }, 1500);
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
    currentFileDiv.innerHTML = tugas.file
        ? `<small style="color:#1a73e8;">File saat ini: <a href="${tugas.file}" target="_blank">${tugas.file_name || 'Lihat File'}</a> (kosongkan jika tidak ingin mengganti)</small>`
        : "";
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
    submitBtn.disabled = false;
    cancelBtn.style.display = "none";
    currentFileDiv.innerHTML = "";
}

cancelBtn.addEventListener("click", resetForm);
loadTugasTable();
