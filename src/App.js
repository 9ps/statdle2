import React from "react";

// import Setup from "./services/Setup";

import Search from "./views/Search";
import Display from "./views/Display";
import Top from "./views/Top";

import ModalHow from "./components/how/ModalHow";
import ModalWin from "./components/win/ModalWin";
import Popup from "./components/popup/Popup";

import "./styles/_defaults.scss";

import { DATA, VALUETEXT } from "./assets/data";

const NUMCOUNTRIES = 194;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.doSearch = this.doSearch.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
    this.updateDisplayWin = this.updateDisplayWin.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.togglePopup = this.togglePopup.bind(this);
    this.updateStorageStats = this.updateStorageStats.bind(this);
    this.parseValue = this.parseValue.bind(this);
    this.reset = this.reset.bind(this);

    this.state = {
      categories: {}, // {<categoryname>: {high: <0>, highName: <"">, low: <0> lowName: <""> target: <0>, activeRow: <0>}, ...}
      history: [], //[{name: "", correct: 0, range: N}, ...]
      modalType: 0, //0: "none", 1: "how" 2: "win from top" 3: "win"
      popupType: 0, //0: "none", 1: "Already Guessed", 2: "Invalid Country", 3: "Copied to Clipboard"
      win: false,
      ended: false,
    };
  }

  reset() {
    console.log("reset!");
    this.setState({
      categories: {}, // {<categoryname>: {high: <0>, highName: <"">, low: <0> lowName: <""> target: <0>, activeRow: <0>}, ...}
      history: [], //[{name: "", correct: 0, range: N}, ...]
      modalType: 0, //0: "none", 1: "how" 2: "win from top" 3: "win"
      popupType: 0, //0: "none", 1: "Already Guessed", 2: "Invalid Country", 3: "Copied to Clipboard"
      win: false,
      ended: false,
    });

    this.setupGame();
  }

  componentDidMount() {
    this.setupStats();
    this.setupGame();
  }

  setupStats() {
    if (!localStorage.getItem("stats")) {
      console.log("no stats found");
      const stats = {
        rounds: 0,
        best: 0,
        average: 0,
        tally: Array(11).fill(0),
      };

      localStorage.setItem("stats", JSON.stringify(stats));
    }
  }

  /* pick target country and categories */
  setupGame() {

    let numCategories = 4;
    if (localStorage.getItem("settings")){
      let settings = JSON.parse(localStorage.getItem("settings"));
      numCategories = settings.numCategories;      
    }

    const targetCountry = this.seedTarget();
    console.log("target country:", DATA[targetCountry][0][1]);
    const seededCategories = this.seedCategories(numCategories);
    // Generate inital state values
    const initialCategories = {};
    for (let i in seededCategories) {
      var index = seededCategories[i];

      initialCategories[index] = {
        target: DATA[targetCountry][index][0],
        high: 0,
        highValues: ["", "", ""],
        low: 0,
        lowValues: ["", "", ""],
        activeRow: -1,
      };
    }

    this.setState({
      categories: initialCategories,
      targetCountry: targetCountry,
    });
  }

  seedTarget() {
    const countryRandIndex = Math.floor(Math.random() * NUMCOUNTRIES); //country randomizer
    return Object.keys(DATA)[countryRandIndex];
  }


  seedCategories(numCategories) {
    let mandatory = [[0,1],[2,3],[4,5,6,7],[8,9,10,11,12,13,14]];
    let crop = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
    let categoriesReturn = [];

    for (let i = 0; i < 4; i++) {
      let index = Math.floor(Math.random() * mandatory[i].length);
      categoriesReturn.push(mandatory[i][index]);
      crop.splice(index,1);
    }

    for(let i = 4; i < numCategories; i++){
      let index = Math.floor(Math.random() * crop.length);
      categoriesReturn.push(...crop.splice(index,1));
    }
    return categoriesReturn;
  }

  /* -------------------- */

  /* logic and display changes for valid country submission */
  updateDisplay(newCountry) {

    let newCategories = { ...this.state.categories }; //creates a seperated copy
    let newValues = DATA[newCountry]; // {[], [], []...}
    let newHistory = { code: newCountry, name: newValues[0][1], correct: 0, range: [] };
    let ended = false;

    //win condition
    if (newCountry === this.state.targetCountry) {
      this.updateDisplayWin(newCategories, newHistory, newCountry, newValues);
      return;
    }

    if (this.state.history.length >= 9) {
      // lose condition
      this.updateStorageStats(0);
      this.togglePopup(5);
      this.toggleModal(3);
      ended = true;
    }

    //loop through data categories; name, pop, area, ...
    for (let i in Object.keys(this.state.categories)) {
      const categoryIndex = Object.keys(this.state.categories)[i];
      const category = this.state.categories[categoryIndex];

      const target = category.target;

      const rank = newValues[categoryIndex][0];
      const value = this.parseValue(newValues[categoryIndex][1], i);
      const name = newValues[0][1];


      //1: if new is higher rank
      if (rank < target) {
        if (category.high === 0 || rank > category.high) {
          category.high = rank;
          category.highValues = [newCountry, name, value];
          category.activeRow = 1;
          newHistory.correct += 1;
        } else {
          category.activeRow = 0;
        }

        //2: if new is lower rank
      } else if (rank > target) {
        if (category.low === 0 || rank < category.low) {
          category.low = rank;
          category.lowValues = [newCountry, name, value];
          category.activeRow = 2;
          newHistory.correct += 1;
        } else {
          category.activeRow = 3;
        }
      }

      let range;
      if (category.low === 0) {
        range = 194 - category.high;
      } else if (category.high === 0) {
        range = category.low;
      } else {
        range = category.low - category.high;
      }
      newHistory.range.push(range);
    }

    let finalHistory = this.state.history.concat(newHistory);

    this.setState({
      categories: newCategories,
      history: finalHistory,
      ended: ended,
    });
  }

  parseValue(value, i){
    const categoryIndex = parseInt(Object.keys(this.state.categories)[i]);
    const valueText = VALUETEXT[categoryIndex];
    if(value === ""){
      return;
    }
    if(valueText[0]){
      return valueText[1] + parseFloat(value).toLocaleString() + valueText[2];
    }
    return valueText[1] + value + valueText[2];
  };


  updateDisplayWin(newCategories, newHistory, newCountry, newValues) {

    this.updateStorageStats(this.state.history.length + 1);
    this.togglePopup(4);
    this.toggleModal(3);


    for (let i in Object.keys(this.state.categories)) {
      const categoryIndex = Object.keys(this.state.categories)[i];
      const category = this.state.categories[categoryIndex];
      const value = this.parseValue(newValues[categoryIndex][1], i);
      const name = newValues[0][1];

      newCategories[categoryIndex] = {
        high: category.target,
        highValues: [newCountry, name, value],
        low: category.target,
        lowValues: [newCountry, name, value],
        activeRow: -2,
      };
      newHistory.range.push(0);
    }

    newHistory.correct = Object.keys(this.state.categories).length;
    let finalHistory = this.state.history.concat(newHistory);

    this.setState({
      categories: newCategories,
      history: finalHistory,
      win: true,
      ended: true,
    });
    return;
  }

  /* update values after country entry */
  updateSettings(numCategories) {
    let settings = JSON.parse(localStorage.getItem("settings")) || {};
    settings.numCategories = numCategories;
    localStorage.setItem("settings", JSON.stringify(settings));
  }

  updateStorageStats(guesses) {
    let stats = JSON.parse(localStorage.getItem("stats"));
    let best = stats.best || 0;
    let average = stats.average || 0;
    let rounds = stats.rounds || 0;
    let tally = stats.tally || Array(11).fill(0);

    // if didnt get a score
    console.log(guesses);
    tally[guesses] += 1;

    if (guesses < best || best === 0) {
      best = guesses;
    }

    if (guesses){
      
      average = Math.round(((average * rounds + guesses) / (rounds + 1)) * 10) / 10;
    }

    rounds = rounds + 1;

    stats = {
      rounds: rounds,
      best: best,
      average: average,
      tally: tally,
    };

    localStorage.setItem("stats", JSON.stringify(stats));
  }

  /* -------------------- */

  //input: 0: Duplicate Country, 1: Invalid Country, 2: Copied to Clipboard, 3: Well Done!, 4: Unlucky Champion!
  togglePopup(type = 0) {
    this.setState({
      popupType: type,
    });
  }

  doSearch(inp) {
    if (!inp) {
      this.togglePopup(2);
      return;
    }
    this.updateDisplay(inp);
  }

  /* changes modal display
  input: 0: "none", 1: "how" 2: "settings" 3: "win"
  */
  toggleModal(type = 0) {
    this.setState({
      modalType: type,
    });
  }

  /* -------------------- */

  render() {
    let modalDisplay = null;
    switch (this.state.modalType) {
      case 0:
        break;
      case 1:
        return (
          <ModalHow toggleModal={this.toggleModal} />
        );
      case 2:
        modalDisplay = (
          <ModalWin
            toggleModal={this.toggleModal}
            togglePopup={this.togglePopup}
            reset={this.reset}
            updateSettings={this.updateSettings}

            targetCountry={this.state.targetCountry}
            categories={this.state.categories}
            history={this.state.history}

            special={false}
            win={this.state.win}
            ended={this.state.ended}
          />
        );
        break;
      case 3:
        modalDisplay = (
          <ModalWin
            toggleModal={this.toggleModal}
            togglePopup={this.togglePopup}
            reset={this.reset}
            updateSettings={this.updateSettings}            

            targetCountry={this.state.targetCountry}
            categories={this.state.categories}
            history={this.state.history}

            special={true}
            win={this.state.win}
            ended={this.state.ended}
          />
        );
        break;
      default:
        break;
    }

    const popupDisplay = this.state.popupType ? <Popup display={this.state.popupType} togglePopup={this.togglePopup} /> : null;

    return (
      <>
        {popupDisplay}
        {modalDisplay}
        <Top
          guessCount={this.state.history.length}
          toggleModal={this.toggleModal}
        />
        <Display
          values={this.state.categories}
        />
        <Search doSearch={this.doSearch} togglePopup={this.togglePopup} history={this.state.history} ended={this.state.ended} />
      </>
    );
  }
}

export default App;
