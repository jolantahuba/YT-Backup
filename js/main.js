'use strict'

const createBtn = document.getElementById('create-btn');
const findBtn = document.getElementById('find-btn');
const exportBtn = document.getElementById('export-btn');

const menuToggler = document.querySelector('.menu__toggler');
const inputFile = document.getElementById('input-file');
const urlInput = document.getElementById('input-url');

const apiKey = 'AIzaSyDlaaI4Y7-fklD-lscHes8jiC8tc7YnGOU';

async function getPlaylistItems(id) {

  // get first response, check data, if nextPage -> continue fetching
  // and pushing data to array
  // u can put parts of request in object and join them in place (?)
  
  const addDesc = document.getElementById('add-description').checked;
  const playlistItems = [];

  let response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=5&playlistId=${id}&key=${apiKey}`);

  if(!response.ok) {
    urlInput.insertAdjacentHTML('afterend', createError('Playlist not found', 'You may check playlist privacy settings - it needs to be public or non-public playlist.'));
    return;
  }

  let result = await response.json();
  // console.log(result);

    const headers = ['ID', 'Title', 'Channel']
    playlistItems.push(headers);
    if(addDesc) headers.push('Description');
  
    for(let item of result.items){

      const data = [
        item.snippet.resourceId.videoId,
        item.snippet.title,
        item.snippet.videoOwnerChannelTitle,
    ];
      if(addDesc) data.push(item.snippet.description);
      playlistItems.push(data);
  }

  while(result.nextPageToken) {
    console.log('continue fetching...');

    response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=5&playlistId=${id}&key=${apiKey}&pageToken=${result.nextPageToken}`);

    result = await response.json();
    // console.log(result);

    for(let item of result.items){

      const data = [
        item.snippet.resourceId.videoId,
        item.snippet.title,
        item.snippet.videoOwnerChannelTitle,
    ];
      if(addDesc) data.push(item.snippet.description);
      playlistItems.push(data);
    }
  
  console.log(playlistItems);
  }

}

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
  clearError();

  const isValid = checkUrl(urlInput.value);
  if(!isValid) {
    urlInput.insertAdjacentHTML('afterend', createError('Invalid URL'));
    // return;
    throw new Error('Invalid URL');
  }
  
  const playlistId = urlInput.value.match(/(?<=[?&]list=).[^&]+(?=&|\b)/);

  // console.log(playlistId);
  getPlaylistItems(playlistId);

});

function checkUrl(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  return regex.test(url);
  // add error handlings maybe
}

function createError(title, desc) {

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

function clearError() {
  const error = document.querySelector('.error');
  if(error) error.remove();
}

function showSection(sectionId) {
  const sections = [...document.querySelectorAll('.section')];

  sections
    .find(section => section.classList.contains('active'))
    .classList.remove('active')

  sections
    .find(section => section.id == sectionId)
    .classList.add('active');
}

inputFile.addEventListener('change', (e) => {
  const fileLabel = document.querySelector('label[for=input-file]');

  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});