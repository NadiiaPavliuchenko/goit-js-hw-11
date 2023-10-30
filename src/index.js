import Notiflix from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const API_KEY = '40312621-8bffe4628de16cbb05ae069a5';
const BASE_URL = 'https://pixabay.com/api/';

const refs = {
  form: document.querySelector('.search-form'),
  gallery_container: document.querySelector('.gallery'),
  load_more: document.querySelector('.load-more'),
  target: document.querySelector('.guardian'),
};

let page = 1;
const per_page = 40;
const scrollCoef = 1.3;
const last_page = 13;
let simplelightbox;

const options = {
  root: null,
  rootMargin: '200px',
};

async function getGalleryItems(searchQuery, page) {
  if (!searchQuery) {
    return Promise.reject('Search query should not be empty');
  }
  const params = {
    key: API_KEY,
    q: searchQuery,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    page,
    per_page,
  };
  const result = await axios.get(BASE_URL, { params });
  if (page === last_page) {
    Notiflix.Notify.info(
      "We're sorry, but you've reached the end of search results."
    );
    refs.load_more.classList.add('visually-hidden');
  }
  return result.data;
}

refs.form.addEventListener('submit', getSearchResult);
refs.load_more.addEventListener('click', loadMore);

const observer = new IntersectionObserver(callback, options);
observer.observe(refs.target);

function getFormData() {
  const formData = new FormData(refs.form);
  const props = Object.fromEntries(formData);
  const { searchQuery } = props;
  return searchQuery;
}

async function getSearchResult(e) {
  e.preventDefault();
  const searchQuery = getFormData();

  resetGallery();
  try {
    const resp = await getGalleryItems(searchQuery, page);
    page += 1;
    const { hits } = resp;

    Notiflix.Notify.success(`Hooray! We found ${resp.totalHits} images.`);
    makeGallery(hits);
    toggleLoadMoreButton();
  } catch (err) {
    Notiflix.Notify.failure('You`ve got an API err:' + err);
  }
}

async function loadMore() {
  const searchQuery = getFormData();

  try {
    const resp = await getGalleryItems(searchQuery, page);
    page += 1;
    const { hits } = resp;

    if (hits.length === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    }

    makeGallery(hits);
    smoothScroll();
  } catch (err) {
    console.log(err);
  }
}

function toggleLoadMoreButton() {
  if (page > 1) {
    refs.load_more.classList.remove('visually-hidden');
  }
}

function createMarkup(hits) {
  const markup = hits
    .map(
      item => `<div class="photo-card">
                    <a href="${item.largeImageURL}">
                      <img src="${item.webformatURL}" alt="${item.tags}" width="405" height="250" loading="lazy" />
                    </a>
                    <div class="info">
                      <p class="info-item">
                          <b>Likes</b> ${item.likes}
                      </p>
                      <p class="info-item">
                          <b>Views</b> ${item.views}
                      </p>
                      <p class="info-item">
                          <b>Comments</b> ${item.comments}
                      </p>
                      <p class="info-item">
                          <b>Downloads</b> ${item.downloads}
                      </p>
                    </div>
                  </div>`
    )
    .join('');
  return markup;
}

function makeGallery(data) {
  refs.gallery_container.insertAdjacentHTML('beforeend', createMarkup(data));
  initSimpleLightbox();
}

function resetGallery() {
  refs.gallery_container.innerHTML = '';
  page = 1;
  refs.load_more.classList.add('visually-hidden');
}

function initSimpleLightbox() {
  if (simplelightbox) {
    simplelightbox.destroy();
  }
  simplelightbox = new SimpleLightbox('.photo-card a');
}

function smoothScroll() {
  const { height: cardHeight } =
    refs.gallery_container.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * scrollCoef,
    behavior: 'smooth',
  });
}

function callback(entries, observer) {
  const searchQuery = getFormData();
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      try {
        const resp = await getGalleryItems(searchQuery, page);
        const { hits } = resp;
        makeGallery(hits);

        if (page === last_page) {
          observer.unobserve(refs.target);
        }
      } catch (err) {
        console.log(err);
      }
    }
  });
}
