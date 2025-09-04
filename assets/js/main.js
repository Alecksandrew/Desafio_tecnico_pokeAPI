"use strict";

async function fetchBasicPokemonData(searchData) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${
        searchData == null || searchData == "" ? "" : searchData
      }`
    );
    console.log("FETCH BASIC DATA" + response);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const pokemonData = await response.json();
    console.log(pokemonData.results);
    return pokemonData.results;
  } catch (error) {
    console.error(error); // -> Vou tentar fazer um card mostrando o tipo de erro que ocorrer
    // para melhorar UX, mas nao sei se dará tempo: Por exemplo, 404 not found -> Nao existe pokemon com esse nome
  }
}

async function fetchComprehensivePokemonData(pokemonName) {
  if (pokemonName == null || pokemonName == "") return;

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const pokemonComprehensiveData = await response.json();
    return pokemonComprehensiveData;
  } catch (error) {
    console.error(error);
  }
}

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

  function validateData(data) {
    const id = data?.id ?? "Id desconhecido";
    const type = data?.types?.[0]?.type?.name ?? "Tipo desconhecido";
    const img = data?.sprites?.front_default ?? "Imagem não encontrada";
    const name = data?.name ?? "Nome desconhecido";

    return { id, type, img, name };
  }

  if (Array.isArray(data)) {
    data.forEach((pokemonData) => {
      const {id, type, img, name} = validateData(pokemonData);

      const newCard = createCard(type, id, img, name);
      cardsContainer.appendChild(newCard);
    });
  } else {
    const {id, type, img, name} = validateData(data);

    const newCard = createCard(type, id, img, name);
    cardsContainer.appendChild(newCard);
  }
}

function handleFormSubmit() {
  const searchForm = document.getElementsByClassName("search-form")[0]; //Estou utilizando className ao inves de atribuir um ID                                                                //para reaproveitar class já criada e porque o projeto é pequeno;
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
}

//===================================EXECUÇÃO=========================================================================================

function startPage() {
  handleInitialPageFetch();
  handleFormSubmit();
}

startPage();
