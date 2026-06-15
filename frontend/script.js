// Mengatur tombol menu di layar HP (Hamburger Menu)
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

// Otomatis menutup menu saat link diklik di layar HP
document.querySelectorAll(".nav-menu li a").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));

// =============================================
// Mengambil data tugas dari Database via API
// =============================================
async function loadTugas() {
    const container = document.getElementById("tugas-container");

    try {
        const response = await fetch(`${API_BASE_URL}/tugas`);

        if (!response.ok) {
            throw new Error("Gagal mengambil data dari server.");
        }

        const data = await response.json();

        if (data.length === 0) {
            container.innerHTML = `<p class="text-center">Belum ada tugas yang ditambahkan.</p>`;
            return;
        }

        container.innerHTML = "";

        data.forEach(tugas => {
            const tanggalFormat = new Date(tugas.tanggal).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            const fileLink = tugas.file
                ? `<a href="${UPLOAD_BASE_URL}/${tugas.file}" target="_blank" class="btn btn-outline">Lihat File</a>`
                : "";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div class="card-body">
                    <h3>${tugas.judul}</h3>
                    <p class="date">${tanggalFormat}</p>
                    <p>${tugas.deskripsi ? tugas.deskripsi : "Tidak ada deskripsi."}</p>
                    ${fileLink}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="text-center">Gagal memuat data tugas. Pastikan server backend berjalan.</p>`;
    }
}

loadTugas();
