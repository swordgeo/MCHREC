// import mysql from "mysql2";

// A catch all place for all the random functions that no longer deserve their own file
//We'll pretend to order these alphabetically but I see myself immediately breaking that convention

//does nothing but capitalizes the first letter of the word provided
export function capitalize(string) {
  
  const firstChar = string.charAt(0).toUpperCase();
  const finalWord = firstChar + string.slice(1);
  return finalWord;
}


export function checkAllPacks() {
  const packCheckboxes = document.getElementsByName("pack-selector");
  for (const checkbox of packCheckboxes) {
    checkbox.checked = true;
  }
}


export function disableRadios(radioList, bool) {
  for (let i = 0; i < radioList.length; i++) {
    radioList[i].disabled = bool;
  }
}


export function findHeroByCode(heroNamesData, code) {
  const heroObj = heroNamesData.find(card => card.code === code);
  return heroObj ? heroObj.heroname : null;
}


export function findHeroInfoByCode(heroNamesData, code) {
  const heroObj = heroNamesData.find(card => card.code === code);
  if (heroObj) {
    return {
      heroName: heroObj.heroname,
      heroPhoto: heroObj.herophoto,
      alterPhoto: heroObj.alterphoto,
    };
  }
  return null;
}


export function findNameByCode(cardsData, code) {
  const cardObj = cardsData.find(card => card.code === code);
  return cardObj ? cardObj.name : null;
}


export function findPhotoByCode(cardsData, code) {
  const cardObj = cardsData.find(card => card.code === code);
  return cardObj ? cardObj.imagesrc : null;
}


export function findURLByCode(cardsData, code) {
  const cardObj = cardsData.find(card => card.code === code);
  return cardObj ? cardObj.url : null;
}


export async function getAspectName(aspect) {
  const response = await fetch(`/api/aspect-name?aspect=${aspect}`);
  const results = await response.json();
  return results ? results.aspect_name : null;
}


export async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}


export function getSelectedPackIds(packsCheckBoxes) {
  const selectedPacks = [];
  for (const checkbox of packsCheckBoxes) {
    if (checkbox.checked) {
      selectedPacks.push(checkbox.value);
    }
  }
  return selectedPacks;
}


// Function to retrieve the name of the selected radio button
export function getSelectedRadioButtonText(radioSet) {
  for (let i = 0; i < radioSet.length; i++) {
    return radioSet[i].textContent.trim();
  }
  return null;
}


// Function to retrieve the value of the selected radio button
export function getSelectedRadioButtonValue(radioSet) {
  for (let i = 0; i < radioSet.length; i++) {
    if (radioSet[i].checked) {
      return radioSet[i].value;
    }
  }
  return null;
}


export async function getVisitCount() {
  try {
    const response = await fetch('/visit-count');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.visitCount;
  } catch (error) {
    console.error('Error fetching visit count:', error);
  }
}


export function hamburger(header) {
  const x = header.querySelector("#hamburgerBtn");
  x.onclick = toggleMenu;
}


export async function loadHeaderFooter() {
  const header = document.querySelector("header");
  const headerTemplate = await loadTemplate("../snippets/header.html");
  renderWithTemplate(headerTemplate, header);

  const footer = document.querySelector("footer");
  const footerTemplate = await loadTemplate("../snippets/footer.html");
  renderWithTemplate(footerTemplate, footer);

  document.getElementById("visit-count").textContent = await getVisitCount();
  return header;
}


export async function loadTemplate(path) {
  const html = await fetch(path);
  const template = await html.text();
  return template;
}


export function renderWithTemplate(
  template,
  parentElement,
  position = "afterbegin",
  data,
  callback
) {
  parentElement.insertAdjacentHTML(position, template);
  if (callback) {
    callback(data);
  }
}


export function showPacks() {
  const packsDiv = document.getElementById("packs");
  packsDiv.classList.toggle("open");
}


export function sqlConnect() {
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT 
  });

  return connection;
}


export function stripQuotes(string) {
  return string.replace(/['"]+/g, '');
}


function toggleMenu() {
  const primaryNav = document.getElementById("primaryNav");
  primaryNav.classList.toggle("open");
  document.getElementById("hamburgerBtn").classList.toggle("open");
}


export function uncheckAllPacks() {
  const packCheckboxes = document.getElementsByName("pack-selector");
  for (const checkbox of packCheckboxes) {
    checkbox.checked = false;
  }
}