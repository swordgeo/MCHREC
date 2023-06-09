import { capitalize } from "./utils.js";

export async function createHeroSelector(heroCardsData) {
  const response = await fetch(`/api/get-packs`);
  const results = await response.json();
  console.log(results);

  const selectorSection = document.querySelector("#hero-select");
  
  const selectorDiv = document.createElement("div");
  selectorDiv.setAttribute("id", "hero");

  //Make a selector for all the heroes, id is their hero code, visible is their hero name
  selectorDiv.innerHTML = `<label for="hero-selector">Choose your hero: </label>`;
  const heroSelect = document.createElement("select");
  heroSelect.setAttribute("name", "hero-selector");
  heroSelect.setAttribute("id", "hero-selector");
  heroSelect.innerHTML = `<option value="none" selected disabled hidden>Choose your hero</option>`;

  for (const hero of heroCardsData) {
    //heroname, code
    const option = document.createElement("option");
    option.setAttribute("value", hero.code);
    option.textContent = hero.heroname;
    heroSelect.appendChild(option);
  }
  selectorDiv.appendChild(heroSelect);
  selectorSection.appendChild(selectorDiv);

  //Make a radio button for each aspect
  //We're gonna make this an exportable function in anticipation for Spider-Woman shenanigans
  const radio = createRadios("aspect");
  selectorSection.appendChild(radio);
  //Actually I think we're just gonna make it right here, then hide with CSS
  const radio2 = createRadios("aspect2");
  selectorSection.appendChild(radio2);

  //percentage-selector
  const percentDiv = document.createElement("div");
  percentDiv.innerHTML = "<span>Sort by: </span>";
  percentDiv.setAttribute("id", "percentage-selector");
  const synergyRadio = createPercentRadio("synergy", true);
  const percentageRadio = createPercentRadio("percentage");
  percentDiv.appendChild(synergyRadio);
  percentDiv.appendChild(percentageRadio);
  selectorSection.appendChild(percentDiv);

  //deck-history
  const historyDiv = document.createElement("div");
  historyDiv.innerHTML = "<span>Deck History: </span>";
  historyDiv.setAttribute("id", "history-selector");
  const historyOptions = [30, 90, 180, 360, 900];
  for (let i in historyOptions) {
    historyDiv.appendChild(createHistoryRadio(historyOptions[i]));
  }
  selectorDiv.appendChild(historyDiv);

  //pack-checklist
  const packsCheckboxesDiv = createPackCheckboxes(results);
  selectorSection.appendChild(packsCheckboxesDiv);

  //submit button
  const submitBtn = document.createElement("button");
  submitBtn.setAttribute("disabled", "");
  submitBtn.setAttribute("id", "submitBtn");
  submitBtn.textContent = "Get Results";
  selectorSection.appendChild(submitBtn);
}


export function createRadios(radioName, basic = false) {
  const div = document.createElement("div");
  div.innerHTML = "<span>Choose your aspect: </span>";
  div.setAttribute("id", radioName);
  const aspects = ["aggression", "justice", "leadership", "protection"];
  if (basic) {
    aspects.push("basic");
  }
  // aspects.forEach(createRadio);
  aspects.forEach((aspect, index) => {
    const radioLabel = document.createElement("label");
    const radioInput = document.createElement("input");
    radioInput.setAttribute("type", "radio");
    radioInput.setAttribute("name", radioName);
    radioInput.setAttribute("value", index+1);
    radioLabel.appendChild(radioInput);
    //visible text
    radioLabel.append(capitalize(aspect));
    div.appendChild(radioLabel);
  });
  return div;
}


function createHistoryRadio(option) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.setAttribute("type", "radio");
  input.setAttribute("name", "history-selector");
  input.setAttribute("value", option);
  if(option == 180) {
    input.setAttribute("checked", "checked");
  }
  label.appendChild(input);
  //visible text
  if (option == 900) {
    label.append("All time")
  } else {
    label.append(option);
  }
  return label;
}


function createPackCheckboxes(packsData) {
  // console.log(packsData);
  const packsDiv = document.createElement("div");
  packsDiv.setAttribute("id", "packs");

  for (const pack of packsData) {
    const packLabel = document.createElement("label");
    const packInput = document.createElement("input");
    packInput.setAttribute("type", "checkbox");
    packInput.setAttribute("name", "pack-selector"); 
    packInput.setAttribute("value", pack.pack_code);
    packInput.checked = true;
    packLabel.appendChild(packInput);
    // visible text
    packLabel.append(pack.pack_name);
    packsDiv.appendChild(packLabel);
  }

  const checkAllButton = document.createElement("button");
  checkAllButton.setAttribute("id", "check-all");
  checkAllButton.textContent = "Check All";

  const uncheckAllButton = document.createElement("button");
  uncheckAllButton.setAttribute("id", "uncheck-all");
  uncheckAllButton.textContent = "Uncheck All";

  packsDiv.appendChild(checkAllButton);
  packsDiv.appendChild(uncheckAllButton);

  return packsDiv;
}


function createPercentRadio(name, checked = false) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.setAttribute("type", "radio");
  input.setAttribute("name", "percentage-selector");
  input.setAttribute("value", name);
  if (checked) {
    input.setAttribute("checked", "checked");
  }
  label.appendChild(input);
  //visible text
  label.append(name);
  return label;
}