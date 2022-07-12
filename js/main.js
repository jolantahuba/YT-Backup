'use strict'

const createBtn = document.getElementById('create-btn');
const findBtn = document.getElementById('find-btn');
const exportBtn = document.getElementById('export-btn');

const menuToggler = document.querySelector('.menu__toggler');
const inputFile = document.getElementById('input-file');
const urlInput = document.getElementById('input-url');

const apiKey = 'AIzaSyDlaaI4Y7-fklD-lscHes8jiC8tc7YnGOU';

async function getPlaylistItems(id) {
  
  const addDesc = document.getElementById('add-description').checked;
  const playlistItems = [];
  const api = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=5&playlistId=${id}&key=${apiKey}`;
  let response, result = null;
  // let result = null;

  try {
    response = await fetch(api);
    if(!response.ok) {
      throw new Error('API error');
    }
    result = await response.json();
  } catch(err) {
    if(response.status === 404) {
      urlInput.insertAdjacentHTML('afterend', createError('Playlist not found', 'Check the URL or playlist privacy settings - should be set to public or non-public'));
    } else {
      urlInput.insertAdjacentHTML('afterend', createError('Some unknown error has occured.', 'Please try again later.'));
    }
    return;
  }

  const headers = ['ID', 'Title', 'Channel', 'PublishedAt']
  if(addDesc) headers.push('Description');
  playlistItems.push(headers);

  pushItems();

  while(result.nextPageToken) {
    // console.log('continue fetching...');
    response = await fetch(api + `&pageToken=${result.nextPageToken}`);
    result = await response.json();
    pushItems();  
  }

  console.log(playlistItems);


  function pushItems() {
    for(let item of result.items){

      const data = [
        item.snippet.resourceId.videoId,
        item.snippet.title,
        item.snippet.videoOwnerChannelTitle,
        item.contentDetails.videoPublishedAt,
      ];
      if(addDesc) data.push(item.snippet.description);
  
      playlistItems.push(data);
    }
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

  if(!checkUrl(urlInput.value)) {
    urlInput.insertAdjacentHTML('afterend', createError('Invalid URL'));
    return;
  }

  const playlistId = urlInput.value.match(/(?<=[?&]list=).[^&]+(?=&|\b)/);
  // console.log(playlistId);

  getPlaylistItems(playlistId);

});

function checkUrl(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  return regex.test(url);
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