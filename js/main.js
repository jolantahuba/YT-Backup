'use strict'

const createBtn = document.querySelector('.menu__create-btn');
const findBtn = document.querySelector('.menu__find-btn');
const menuBtns = document.querySelectorAll('.menu__btn');

const menuToggler = document.querySelector('.menu__toggler');
const sections = [...document.querySelectorAll('.section')];
const inputFile = document.getElementById('input-file');
const exportBtn = document.getElementById('export-btn');

createBtn.addEventListener('click', () => {
  sections
  .find(section => section.classList.contains('active'))
  .classList.remove('active')

  sections
  .find(section => section.id == 'create')
  .classList.add('active');

  findBtn.classList.remove('active');
  createBtn.classList.add('active');

  menuToggler.classList.remove('switched');

});

findBtn.addEventListener('click', () => {
  sections
  .find(section => section.classList.contains('active'))
  .classList.remove('active')

  sections
  .find(section => section.id == 'find')
  .classList.add('active');

  createBtn.classList.remove('active');
  findBtn.classList.add('active');
  
  menuToggler.classList.add('switched');
});

inputFile.addEventListener('change', (e) => {
  const fileLabel = document.querySelector('label[for=input-file]');

  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});
