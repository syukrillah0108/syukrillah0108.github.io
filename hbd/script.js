// ============================================
// DAFTAR EMOJI & DATA KONTEN (Teks Update dari User)
// ============================================
const emojiList = ["😂", "💨", "✨", "🎬", "🎞️","😂", "💨", "✨", "🎬", "🎞️"];

const bdayData = {
    "config": { "senderName": "Masyuk", "audioId": "bgMusic" },
    "slides": [
        { "id": 1, "waktu_detik": 0.0, "photo": "foto1.jpg", "title": "Puisi Hitut", "deskripsi": "Persiapkan dirimu untuk mahakarya sastra paling wangi abad ini..." },
        { "id": 2, "waktu_detik": 4.2, "photo": "foto2.jpg", "title": "Jalma Jujur", "deskripsi": "Jalma anu daek ngaku lamun ges hitut." },
        { "id": 3, "waktu_detik": 9.0, "photo": "foto3.jpg", "title": "Jalma Teu Jujur", "deskripsi": "Jalma nu hitut tuluy nyalahkeun batur." },
        { "id": 4, "waktu_detik": 17.0, "photo": "foto4.jpg", "title": "Jalma Belegug", "deskripsi": "Jalma anu nahan hitut, mang jam-jam lilana." },
        { "id": 5, "waktu_detik": 23.0, "photo": "foto5.jpg", "title": "Jalma nu Berwawasan", "deskripsi": "Jalma anu apal, iraha kuduna hitut." },
        { "id": 6, "waktu_detik": 31.2, "photo": "foto6.jpg", "title": "Jalma nu Misterius", "deskripsi": "Jalma anu hitut, tapi batur eweuh anu nyahoeun." },
        { "id": 7, "waktu_detik": 42.3, "photo": "foto7.jpg", "title": "Jalma nu sok Gugup", "deskripsi": "Jalma nu ujug-ujug nahan hitut mun keur hitut." },
        { "id": 8, "waktu_detik": 48.0, "photo": "foto8.jpg", "title": "Jalma nu Percaya Diri", "deskripsi": "Jalma nu ngayakinan Hitutna seungit." },
        { "id": 9, "waktu_detik": 54.0, "photo": "foto9.jpg", "title": "Jalma nu Sadis", "deskripsi": "Jalma nu hitut bari di bekep kulengeun, tuluy di bekepkeun ka irung batur." },
        { "id": 10, "waktu_detik": 61.0, "photo": "foto10.jpg", "title": "Jalma nu Isinan", "deskripsi": "Jalma nu hitutna teu tisada, tapi ngarasa isin sorangan." },
        { "id": 11, "waktu_detik": 69.0, "photo": "foto1.jpg", "title": "Jalma nu Sial", "deskripsi": "Mun hitut kaluar jenung bukur-bukurna." },
        { "id": 12, "waktu_detik": 82.0, "photo": "foto3.jpg", "title": "Jalma nu Stategic", "deskripsi": "lamun hitut sok bari seuri ngagakgak meh nutupan suara hitut na." },
        { "id": 13, "waktu_detik": 92.0, "photo": "foto2.jpg", "title": "Jalma nu Bodo", "deskripsi": "Lamun ges hitut tuluy narik napas keur ngagantian hitutnanu kaluar." },
        { "id": 14, "waktu_detik": 102.0, "photo": "foto5.jpg", "title": "Jalma nu Pedit", "deskripsi": "Lamun hitut di kaluarkeun saeutik-eutik nepika tisada tit tit tit." },
        { "id": 15, "waktu_detik": 112.0, "photo": "foto4.jpg", "title": "Jalma nu Sombong", "deskripsi": "Jalma nu sok ngambean hitutna sorangan" },
        { "id": 16, "waktu_detik": 120.0, "photo": "foto7.jpg", "title": "Jalma nu Ramah", "deskripsi": "Jalma nu sok ngambean hitut batur" },
        { "id": 17, "waktu_detik": 128.0, "photo": "foto8.jpg", "title": "Jalma nu Tara Gaul", "deskripsi": "Hitutna sok bari nyumput" },
        { "id": 18, "waktu_detik": 136.0, "photo": "foto12.jpeg", "title": "Jalma nu Sakti", "deskripsi": "Mun hitut bari make tanaga dalem" },
        { "id": 19, "waktu_detik": 140.0, "photo": "foto11.jpeg", "title": "Jalma nu Pinter", "deskripsi": "Jalma anu bisa nyirian hitut batur" }
    ]
};

let activeIndex = -1; 
const audioEl = document.getElementById(bdayData.config.audioId);

document.addEventListener("DOMContentLoaded", () => {
    renderSlides();
    renderArchiveList(); // Render daftar arsip
    setupAudioSync();
});

// Render Slide Utama
function renderSlides() {
    const wrapper = document.getElementById('slideshow');
    bdayData.slides.forEach((slide) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `slide-card`; 
        slideDiv.id = `slide-${slide.id}`;
        
        slideDiv.innerHTML = `
            <div class="film-photo-wrapper">
                <img src="${slide.photo}" class="slide-img">
            </div>
            <h2 class="slide-title">${slide.title}</h2>
            <p class="slide-text">${slide.deskripsi}</p>
            <div style="margin-top:15px; font-size:0.8rem; color:#666; font-family:monospace;">
                ARCHIVE 00${slide.id} | By ${bdayData.config.senderName}
            </div>
        `;
        wrapper.appendChild(slideDiv);
    });
}

// Bikin Daftar Arsip di dalam Modal Widget
function renderArchiveList() {
    const listContainer = document.getElementById('archiveList');
    listContainer.innerHTML = ''; // Kosongkan dulu

    bdayData.slides.forEach((slide) => {
        // Konversi detik ke format MM:SS
        const m = Math.floor(slide.waktu_detik / 60).toString().padStart(2, '0');
        const s = Math.floor(slide.waktu_detik % 60).toString().padStart(2, '0');
        const timeString = `${m}:${s}`;

        const item = document.createElement('div');
        item.className = 'archive-item';
        // Saat diklik, lari ke fungsi jumpToTime
        item.setAttribute('onclick', `jumpToTime(${slide.waktu_detik})`);
        item.innerHTML = `
            <span class="archive-name">${slide.id}. ${slide.title}</span>
            <span class="archive-time">${timeString}</span>
        `;
        listContainer.appendChild(item);
    });
}

function startAutoCinema() {
    audioEl.play().catch(e => console.log("Auto-play diblokir browser."));
    document.getElementById('playPauseBtn').innerText = "⏸";
    
    const welcome = document.getElementById('welcomeScreen');
    welcome.style.transform = 'translateY(-100%)';
    setTimeout(() => {
        welcome.classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('topBar').classList.remove('hidden'); // Munculkan top bar
    }, 1200);
}

// ============================================
// MEDIA PLAYER & MODAL ENGINE
// ============================================

// Buka/Tutup Modal Arsip
function openArchiveModal() {
    document.getElementById('archiveModal').classList.remove('hidden');
}
function closeArchiveModal() {
    document.getElementById('archiveModal').classList.add('hidden');
}

// Fungsi utama saat widget list diklik
function jumpToTime(targetTime) {
    audioEl.currentTime = targetTime;
    if (audioEl.paused) {
        audioEl.play();
        document.getElementById('playPauseBtn').innerText = "⏸";
    }
    closeArchiveModal(); // Tutup popup setelah diklik
}

function setupAudioSync() {
    const timeDisplay = document.getElementById('currentTimeDisplay');
    const progressFill = document.getElementById('progressFill');

    audioEl.addEventListener('timeupdate', () => {
        const currentTime = audioEl.currentTime;
        const duration = audioEl.duration || 0;
        
        const m = Math.floor(currentTime / 60).toString().padStart(2, '0');
        const s = Math.floor(currentTime % 60).toString().padStart(2, '0');
        timeDisplay.innerText = `${m}:${s}`;

        if (duration > 0) {
            const progressPercent = (currentTime / duration) * 100;
            progressFill.style.width = `${progressPercent}%`;
        }

        let newActiveIndex = -1;
        for (let i = 0; i < bdayData.slides.length; i++) {
            if (currentTime >= bdayData.slides[i].waktu_detik) {
                newActiveIndex = i; 
            }
        }

        if (newActiveIndex !== activeIndex && newActiveIndex !== -1) {
            changeSlideTo(newActiveIndex);
            activeIndex = newActiveIndex;
        }
    });

    audioEl.addEventListener('ended', () => {
        document.getElementById('playPauseBtn').innerText = "▶";
    });
}

function togglePlay() {
    const btn = document.getElementById('playPauseBtn');
    if (audioEl.paused) { audioEl.play(); btn.innerText = "⏸"; } 
    else { audioEl.pause(); btn.innerText = "▶"; }
}

function seekAudio(event) {
    const container = document.getElementById('progressContainer');
    const rect = container.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    audioEl.currentTime = percentage * audioEl.duration;
}

function nextSegment() {
    if (activeIndex < bdayData.slides.length - 1) {
        audioEl.currentTime = bdayData.slides[activeIndex + 1].waktu_detik + 0.1;
    }
}

function prevSegment() {
    if (activeIndex > 0) {
        audioEl.currentTime = bdayData.slides[activeIndex - 1].waktu_detik + 0.1;
    } else {
        audioEl.currentTime = 0;
    }
}

function shareKocak() {
    alert("🔗 Link dokumen rahasia berhasil disalin!");
}

// ============================================
// ANIMASI
// ============================================
function changeSlideTo(index) {
    const slides = document.querySelectorAll('.slide-card');
    slides.forEach(slide => slide.classList.remove('active-slide'));
    
    setTimeout(() => {
        slides[index].classList.add('active-slide');
        spawnEmojis();
    }, 50);
}

function spawnEmojis() {
    const container = document.getElementById('emoji-container');
    const numEmojis = Math.floor(Math.random() * 8) + 12; 

    for (let i = 0; i < numEmojis; i++) {
        const emojiEl = document.createElement('div');
        emojiEl.innerText = emojiList[Math.floor(Math.random() * emojiList.length)];
        const willPop = Math.random() < 0.4;
        emojiEl.className = willPop ? 'emoji-bubble pop-up' : 'emoji-bubble float-up';
        emojiEl.style.left = Math.floor(Math.random() * 90) + 'vw';
        emojiEl.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem';
        const duration = Math.random() * 2 + 1.5; 
        emojiEl.style.animationDuration = duration + 's';
        container.appendChild(emojiEl);
        setTimeout(() => emojiEl.remove(), duration * 1000);
    }
}