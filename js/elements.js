export const elements = {
  // buttons
  createBtn: document.getElementById('create-btn'),
  findBtn: document.getElementById('find-btn'),
  exportBtn: document.getElementById('export-btn'),
  downloadBtn: document.getElementById('download-btn'),
  checkBtn: document.getElementById('check-btn'),
  updateBtn: document.getElementById('update-btn'),
  downloadChangesBtn: document.getElementById('download-changes-btn'),
  menuToggler: document.querySelector('.menu__toggler'),

  // inputs
  fileInput: document.getElementById('input-file'),
  fileLabel: document.querySelector('label[for=input-file]'),
  urlInput: document.getElementById('input-url'),
  descriptionCheckbox: document.getElementById('add-description'),

  // other
  sections: [...document.querySelectorAll('.section')],
  overlay: document.querySelector('.overlay'),
  loader: document.querySelector('.loader'),
};