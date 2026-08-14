let currentLang = 'id'; // Bahasa default

document.addEventListener("DOMContentLoaded", () => {
    loadData(currentLang);

    // Event listener untuk tombol bahasa
    document.getElementById('btn-id').addEventListener('click', () => {
        if (currentLang !== 'id') {
            currentLang = 'id';
            updateLangButtons();
            loadData(currentLang);
        }
    });

    document.getElementById('btn-en').addEventListener('click', () => {
        if (currentLang !== 'en') {
            currentLang = 'en';
            updateLangButtons();
            loadData(currentLang);
        }
    });
});

function updateLangButtons() {
    document.getElementById('btn-id').classList.toggle('active', currentLang === 'id');
    document.getElementById('btn-en').classList.toggle('active', currentLang === 'en');
}

function loadData(lang) {
    const jsonFile = `data-${lang}.json`;
    
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => buildPortfolio(data))
        .catch(error => console.error("Error loading JSON data:", error));
}

function buildPortfolio(data) {
    // 0. Render UI Text (Teks Antarmuka)
    document.getElementById('ui-skills-title').textContent = data.ui.skillsTitle;
    document.getElementById('ui-projects-title').textContent = data.ui.projectsTitle;
    document.getElementById('ui-experience-title').textContent = data.ui.experienceTitle;
    document.getElementById('ui-docs-title').textContent = data.ui.docsTitle;
    document.getElementById('ui-footer-text').textContent = data.ui.footerText;

    // 1. Render Profil
    document.title = `Portofolio | ${data.profile.name}`;
    document.getElementById('profile-name').textContent = data.profile.name;
    document.getElementById('profile-title').textContent = data.profile.title;
    document.getElementById('profile-about').textContent = data.profile.about;
    document.getElementById('link-email').href = `mailto:${data.profile.email}`;
    document.getElementById('link-wa').href = data.profile.wa;
    document.getElementById('link-ig').href = data.profile.ig;
    document.getElementById('link-capcut').href = data.profile.capcut;
    document.getElementById('alamat').href = data.profile.alamat;
    document.getElementById('footer-name').textContent = data.profile.name;
    
    const profileImg = document.getElementById('profile-img');
    profileImg.src = data.profile.image;
    profileImg.onerror = () => { profileImg.src = 'https://via.placeholder.com/150/1e1e1e/64ffda?text=Profil'; };

    // 2. Render Skills
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = ''; // Kosongkan dulu sebelum diisi
    data.skills.forEach(skill => {
        const li = document.createElement('li');
        li.textContent = skill;
        skillsList.appendChild(li);
    });

    // 3. Render Projects
    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = ''; // Kosongkan dulu
    data.projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${project.image}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/300x180/1e1e1e/64ffda?text=Proyek'">
            <h4>${project.title}</h4>
            <span class="card-tech">${project.tech.join(' • ')}</span>
        `;
        
        card.addEventListener('click', () => openModal(project));
        projectsGrid.appendChild(card);
    });

    // 4. Render Pengalaman
    const expList = document.getElementById('experience-list');
    expList.innerHTML = ''; // Kosongkan dulu
    data.experience.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'exp-item';
        item.innerHTML = `
            <h4>${exp.role}</h4>
            <div class="org">${exp.organization}</div>
            <p>${exp.description}</p>
        `;
        expList.appendChild(item);
    });
}

// === Logika Modal ===
const modal = document.getElementById('project-modal');
const closeBtn = document.querySelector('.close-btn');

function openModal(project) {
    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-detail').textContent = project.detail;
    
    const modalTech = document.getElementById('modal-tech');
    modalTech.innerHTML = '';
    project.tech.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        modalTech.appendChild(li);
    });

    const modalDocs = document.getElementById('modal-docs');
    modalDocs.innerHTML = '';
    if (project.documentation && project.documentation.length > 0) {
        project.documentation.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.onerror = () => { img.src = 'https://via.placeholder.com/400x250/1e1e1e/64ffda?text=Dokumentasi'; };
            modalDocs.appendChild(img);
        });
    } else {
        // Tampilkan teks berdasarkan bahasa
        modalDocs.innerHTML = `<p style="color: #666;">${currentLang === 'id' ? 'Belum ada dokumentasi tambahan.' : 'No additional documentation yet.'}</p>`;
    }

    modal.style.display = 'block';
}

closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (event) => { if (event.target == modal) { modal.style.display = 'none'; } });