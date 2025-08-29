document.addEventListener('DOMContentLoaded', () => {
    const skip = document.getElementById('skip-auth');
    const start = document.getElementById('start-auth');
    const back = document.getElementById('back-to-slide-1');
    const slide1 = document.getElementById('splash-slide-1');
    const slide2 = document.getElementById('splash-slide-2');
    const form = document.getElementById('auth-form');

    if (start) start.addEventListener('click', () => { slide1.classList.add('hidden'); slide2.classList.remove('hidden'); });
    if (back) back.addEventListener('click', () => { slide2.classList.add('hidden'); slide1.classList.remove('hidden'); });
    if (skip) skip.addEventListener('click', () => { window.location.href = 'Dashboard.html'; });
    if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('tebnegar_authenticated', 'true');
        window.location.href = 'Dashboard.html';
    });
});


