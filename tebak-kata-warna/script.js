let daftarKata = [];
let daftarWarna = [];

function acak(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function acakWarnaTeks() {
    // Warna teks random, hindari warna terlalu gelap/terang
    const letters = '456789ABCD';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

function tampilkanKataWarna() {
    const kata = acak(daftarKata);
    const warnaBg = acak(daftarWarna);
    const warnaTeks = acakWarnaTeks();
    const kataDisplay = document.getElementById('kataDisplay');
    kataDisplay.textContent = kata;
    kataDisplay.style.color = warnaTeks;
    document.body.style.background = warnaBg;
}

document.getElementById('startBtn').onclick = function() {
    daftarKata = document.getElementById('kataInput').value.split(',').map(k => k.trim()).filter(Boolean);

    // Ambil semua input warna
    const warnaInputs = document.querySelectorAll('#warnaInputs input[type="color"]');
    daftarWarna = Array.from(warnaInputs).map(input => input.value);

    if (daftarKata.length === 0 || daftarWarna.length === 0) {
        alert('Masukkan minimal satu kata dan satu warna!');
        return;
    }
    document.querySelector('.input-section').style.display = 'none';
    document.querySelector('h1').style.display = 'none';
    document.getElementById('gameSection').style.display = 'flex';
    tampilkanKataWarna();
};

document.getElementById('nextBtn').onclick = tampilkanKataWarna;

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' && document.getElementById('gameSection').style.display === 'flex') {
        tampilkanKataWarna();
    }
});

// Tambah input warna baru
document.getElementById('addColorBtn').onclick = function() {
    const warnaInputs = document.getElementById('warnaInputs');
    const input = document.createElement('input');
    input.type = 'color';
    input.value = '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    warnaInputs.appendChild(input);
};