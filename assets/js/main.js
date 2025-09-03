const movieListElement = document.querySelector('#movies-list')

const searchInput = document.querySelector('#search')
const searchCheckbox = document.querySelector('#checkbox')

let isSearchTriggerEnabled = false
let lastSearchValue

const debounceTimeout = (() => {
  let timerId = null
  return (cb, ms) => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
    timerId = setTimeout(cb, ms)
  }
})()

const getData = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.Search) throw new Error('The server returned incorrect data')

      return data.Search
    })
    .catch(console.error)

const addMovieToList = ({ Poster: poster, Title: title, Year: year }) => {
  const item = document.createElement('div')
  const img = document.createElement('img')

  item.classList.add('movie')
  img.classList.add('movie__poster')

  img.src = poster && poster.startsWith('http') ? poster : 'assets/images/no-image.png'
  img.title = `${title} ${year}`

  item.append(img)

  movieListElement.prepend(item)
}

const clearMoviesMarkup = () => {
  if (movieListElement) movieListElement.innerHTML = ''
}

const inputSearchHandler = (e) => {
  debounceTimeout(() => {
    const searchValue = e.target.value.trim()

    if (!searchValue || searchValue.length < 4 || searchValue === lastSearchValue) return

    if (!isSearchTriggerEnabled) clearMoviesMarkup()
    getData(`https://www.omdbapi.com/?apikey=304fd83&s=${searchValue}`)
      .then((data) => data.forEach(addMovieToList))
      .catch((err) => console.error(err))

    searchInput.value = ''

    lastSearchValue = searchValue
  }, 2000)
}

searchInput.addEventListener('input', inputSearchHandler)
searchCheckbox.addEventListener('change', (e) => {
  isSearchTriggerEnabled = e.target.checked
})
