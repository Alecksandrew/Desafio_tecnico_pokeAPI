"use strict";


//Estado global
const paginationState = {
  currentPage: 1,
  itemsPerPage: 18,
  totalItems: 0,
};

const paginationContainer = document.querySelector(".pagination");


//Placeholder quando não tiver imagem de pokemon
const URL_PLACEHOLDER_IMAGE = "assets/imgs/Image-not-found.png"

//===================================LÓGICA DE BUSCA DE DADOS=============================================================
async function fetchBasicPokemonData() {
  try {
    const offset =
      (paginationState.currentPage - 1) * paginationState.itemsPerPage;

    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${paginationState.itemsPerPage}&offset=${offset}`
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const pokemonData = await response.json();
    paginationState.totalItems = pokemonData.count;
    return pokemonData.results;
  } catch (error) {
    console.error(error);
  }
}

async function fetchComprehensivePokemonData(pokemonName) {
  if (pokemonName == null || pokemonName == "") return;

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );

   if (!response.ok) {
      if (response.status === 404) {
        return null; 
      }
      throw new Error(response.statusText);
    }

    const pokemonComprehensiveData = await response.json();
    return pokemonComprehensiveData;
  } catch (error) {
    console.error(error);
  }
}

//===================================LOGICA DE RENDERIZAÇÃO============================================================
function createCard(type, id, imageUrl, title) {
  const li = document.createElement("li");
  li.className = "cards-container__card card";

  li.innerHTML = `
    <div class="card__header">
      <span class="card__type">${type}</span>
      <span class="card__id">#${id}</span>
    </div>
    <div class="card__img-wrapper">
      <img
        src="${imageUrl}"
        alt="${title}"
        class="card__img"
      />
    </div>
    <span class="card__title">${title}</span>
  `;

  return li;
}

function renderCardsWithData(data) {
  const cardsContainer = document.getElementsByClassName("cards-container")[0];
  cardsContainer.innerHTML = "";

  if (data === null) {
    cardsContainer.innerHTML = `<p class="error-message">Pokémon não encontrado. Tente novamente!</p>`;
    return;
  }

  function validateData(data) {
    const id = data?.id ?? "Id?";
    const type = data?.types?.[0]?.type?.name ?? "Tipo?";
    const img = data?.sprites?.front_default ?? URL_PLACEHOLDER_IMAGE;
    const name = data?.name ?? "Nome desconhecido";

    return { id, type, img, name };
  }

  if (Array.isArray(data)) {
    data.forEach((pokemonData) => {
      const { id, type, img, name } = validateData(pokemonData);

      const newCard = createCard(type, id, img, name);
      cardsContainer.appendChild(newCard);
    });
  } else {
    const { id, type, img, name } = validateData(data);

    const newCard = createCard(type, id, img, name);
    cardsContainer.appendChild(newCard);
  }
}


//===================================LOGICA PRINCIPAL=============================================================
function handleFormSubmit() {
  const searchForm = document.getElementsByClassName("search-form")[0]; //Estou utilizando className ao inves de atribuir um ID para reaproveitar class já criada e porque o projeto é pequeno;
  const searchInput = document.getElementsByClassName("search-form__input")[0];

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchText = searchInput.value;
    if (searchText == null || searchText == "") {
      handleInitialPageFetch();
    } else {
      const comprehensiveDataFromAPI = await fetchComprehensivePokemonData(
        searchText
      );
      renderCardsWithData(comprehensiveDataFromAPI);
      paginationContainer.innerHTML = "";
      searchForm.reset();
    }
  });
}

async function handleInitialPageFetch() {
  const basicDataFromAPI = await fetchBasicPokemonData();
  const pokemonNames = basicDataFromAPI.map((pokemonData) => pokemonData.name);

  const comprehensivePokemonDataPromises = pokemonNames.map((name) =>
    fetchComprehensivePokemonData(name)
  );
  const comprehensiveDataFromAPI = await Promise.all(
    comprehensivePokemonDataPromises
  );

  renderCardsWithData(comprehensiveDataFromAPI);

  setupPagination(
    paginationState.totalItems,
    paginationState.itemsPerPage,
    paginationState.currentPage
  );
}


//=========================LOGICA DE PAGINAÇÃO============================================================



function setupPagination(totalItems, itemsPerPage, currentPage) {
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return;

  //Array com a lógica de paginação
  const pages = createPaginationLogic(totalPages, currentPage);

  const prevButtonDisabled = currentPage === 1 ? "pagination__link--disabled" : "";
  paginationContainer.innerHTML += `
        <li class="pagination__item">
            <a class="pagination__link ${prevButtonDisabled}" href="#" data-page="previous">Anterior</a>
        </li>
    `;

  pages.forEach((p) => {
    if (p === "...") {
      paginationContainer.innerHTML += `<li><span class="pagination__ellipsis">...</span></li>`;
    } else {
      const isActive = p === currentPage ? "pagination__link--active" : "";
      const ariaCurrent = p === currentPage ? 'aria-current="page"' : "";
      paginationContainer.innerHTML += `
                <li class="pagination__item">
                    <a class="pagination__link ${isActive}" ${ariaCurrent} href="#" data-page="${p}">${p}</a>
                </li>
            `;
    }
  });

  const nextButtonDisabled =
    currentPage === totalPages ? "pagination__link--disabled" : "";
  paginationContainer.innerHTML += `
        <li class="pagination__item">
            <a class="pagination__link ${nextButtonDisabled}" href="#" data-page="next">Próximo</a>
        </li>
    `;
}

function createPaginationLogic(totalPages, currentPage) {
  const pagesToShow = [];
  const pagesAround = 1;

  //Se nao tiver muitas paginas de resultado, isso vai mostrar todas
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pagesToShow.push(i);
    }
    return pagesToShow;
  }

  //Se tiver muitas paginas irá seguir a lógica de
  //[primeira pagina, ..., x, x+1, x+2 ... ultima pagina ]

  //Primeira página sempre obrigatória
  pagesToShow.push(1);

  //Se a pagina atual tiver mais de 3 casas de distâncias do inicio, então simule reticências
  if (currentPage > pagesAround + 2) {
    pagesToShow.push("...");
  }

  // Lógica para mostrar -> [pagina anterior, atual, próxima] -> Com exceção da primeira e última página que sempre serão mostradas
  
  for (
    let i = Math.max(2, currentPage - pagesAround);
    i <= Math.min(totalPages - 1, currentPage + pagesAround);
    i++
  ) {
    if (!pagesToShow.includes(i)) {
      pagesToShow.push(i);
    }
  }

  //Se a pagina atual tiver mais de 3 casas de distâncias do final, então simule reticências
  if (currentPage < totalPages - (pagesAround + 1)) {
    pagesToShow.push("...");
  }

  //última página sempre obrigatória
  if (!pagesToShow.includes(totalPages)) {
    pagesToShow.push(totalPages);
  }

  return pagesToShow;
}

function handlePaginationClick(event){

  event.preventDefault();
  const clickedElement = event.target;

  if (
    clickedElement.tagName !== "A" ||
    clickedElement.classList.contains("pagination__link--disabled")
  ) {
    return;
  }

  let { totalItems, itemsPerPage, currentPage } = paginationState;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  let newPage = currentPage;

  const pageToGo = clickedElement.dataset.page;

  if (pageToGo === "previous") {
    if (currentPage > 1) {
      newPage--;
    }
  } 
  else if (pageToGo === "next") {
    if (currentPage < totalPages) {
      newPage++;
    }
  } else {
    newPage = parseInt(pageToGo, 10); 
  }

  //Atualiza o estado global
  paginationState.currentPage = newPage;

  handleInitialPageFetch();
}



//===================================EXECUÇÃO=============================================================
function startPage() {
  handleInitialPageFetch();
  handleFormSubmit();

  paginationContainer.addEventListener("click", handlePaginationClick);
}




startPage();
