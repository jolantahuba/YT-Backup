'use strict'

const createBtn = document.querySelector('.menu__create-btn');
const findBtn = document.querySelector('.menu__find-btn');
const container = document.querySelector('.container');
const inputFile = document.getElementById('input-file');
const exportBtn = document.getElementById('export-btn');

createBtn.addEventListener('click', () => {
  container.classList.remove('find-view')
});
findBtn.addEventListener('click', () => {
  container.classList.add('find-view')
});

inputFile.addEventListener('change', (e) => {
  const fileLabel = document.querySelector('label[for=input-file]');

  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});
