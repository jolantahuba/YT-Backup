'use strict'

const createBtn = document.querySelector('.menu__create-btn');
const findBtn = document.querySelector('.menu__find-btn');
const menuToggler = document.querySelector('.menu__toggler');
const inputFile = document.querySelector('.find__input-file');
const exportBtn = document.getElementById('export-btn');

createBtn.addEventListener('click', () => {

  showSection('create');
  findBtn.classList.remove('active');
  createBtn.classList.add('active');
  menuToggler.classList.remove('switched');

});

findBtn.addEventListener('click', () => {

  showSection('find');
  createBtn.classList.remove('active');
  findBtn.classList.add('active');
  menuToggler.classList.add('switched');

});

exportBtn.addEventListener('click', (e) => {
  e.preventDefault();

  const urlInput = document.getElementById('input-url');

  if(checkUrl(urlInput.value) === false) {
    urlInput.insertAdjacentHTML('afterend', createErrorElement('Invalid URL'));
    return;
  }

  // prevent adding infinite errors !!

});

function checkUrl(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  return regex.test(url);
}

function createErrorElement(title, desc) {

  let errorElement = `
  <div class="error">
    <div class="error__title">
      <img src="icons/error.svg" alt="">
      <p>${title}</p>
    </div>
    ${desc ? `<p class="error__desc">${desc}</p>` : ``}
  </div>`;

  return errorElement;
}

inputFile.addEventListener('change', (e) => {
  const fileLabel = document.querySelector('label[for=input-file]');

  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});

function showSection(sectionId) {
  const sections = [...document.querySelectorAll('.section')];

  sections
    .find(section => section.classList.contains('active'))
    .classList.remove('active')

  sections
    .find(section => section.id == sectionId)
    .classList.add('active');
}