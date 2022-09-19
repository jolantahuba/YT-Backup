import { elements } from "./elements.js";

export function addFileNameDisplay(e) {
  if(!e.target.value) {
    elements.fileLabel.innerHTML = `
    <img src="icons/file.svg" alt="">
    Choose your backup file`
    return;
  }
  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  elements.fileLabel.textContent = fileName;
}

export function addScreenLock() {
  elements.overlay.classList.add('active');
  elements.loader.classList.add('active');
}

export function removeScreenLock() {
  elements.overlay.classList.remove('active');
  elements.loader.classList.remove('active');
}

export function showSection(sectionId) {
  clearError();

  elements.sections
    .find(section => section.classList.contains('active'))
    .classList.remove('active')

  elements.sections
    .find(section => section.id == sectionId)
    .classList.add('active');
}

export function showPlaylistInfo(info, fileSize) {
  const title = document.querySelector('[data-label=title]');
  const author = document.querySelector('[data-label=author]');
  const videos = document.querySelector('[data-label=videos]');
  const size = document.querySelector('[data-label=size]');
  
  title.textContent = info['Playlist title'];
  author.textContent = info['Playlist author'];
  videos.textContent = info['Videos'];
  size.textContent = (fileSize / 1024).toFixed(1) + 'KB';
}

export function showComparedItems(compared) {
  const addedCounter = document.getElementById('added-counter');
  const removedCounter = document.getElementById('removed-counter');
  const addedList = document.getElementById('added-list');
  const removedList = document.getElementById('removed-list');

  addedList.textContent = '';
  removedList.textContent = '';
  addedCounter.textContent = compared.added.length;
  removedCounter.textContent = compared.removed.length;

  for(let item of compared.added) {
    const li = document.createElement('li');
    li.textContent = '+ ' + item[1];
    addedList.appendChild(li);
  }

  for(let item of compared.removed) {
    const li = document.createElement('li');
    li.textContent = '- ' + item[1];
    removedList.appendChild(li);
  }
}

export function createError(element, message, details) {
  clearError();
  const errSvg = 'icons/error.svg';

  let error = `
  <div class="error">
    <div class="error__title">
      <img src=${errSvg} alt="">
      <p>${message}</p>
    </div>
    ${details ? `<p class="error__desc">${details}</p>` : ``}
  </div>`;

  element.insertAdjacentHTML('afterend', error);
}

function clearError() {
  let error = document.querySelector('.error');
  if(error) error.remove();
}