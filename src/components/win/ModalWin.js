import React from "react";
import StatsDisplay from "./StatsDisplay";
import WinCountries from "./WinCountries";
import './modalWin.scss';
import Close from '../../assets/icons/close.svg';
import { DATA } from "../../assets/data";
import { COUNTRYEMOJI } from "../../assets/data";


const FocusTrap = require('focus-trap-react');
class ModalWin extends React.Component {
  constructor(props) {
    super(props);

    this.share = this.share.bind(this);
    this.update = this.update.bind(this);
    this.stopPropagation = this.stopPropagation.bind(this);

  }


  stopPropagation(e) {
    if (e) {
      e.stopPropagation();
    }
  }

  update(e) {
    e.preventDefault();
    this.props.updateSettings(e.target.value);
  }


  /* what is returned when share clicked */
  share(e) {
    // Get day of challenge

    const history = this.props.history;
    const guessAmount = this.props.win ? history.length : "X";
    let text = "#Statdle " + guessAmount + "/10\n";
    let max = 0;

    for (let i = 0; i < history.length; i++) {
      text += "\n" + COUNTRYEMOJI[history[i].code];
      
      let correct = history[i].correct;
      
      if(i === 0){
        max = correct;
      }

      for(let i = 0; i < correct; i++){
        text += "🟪";
      }
      for(let i = correct; i < max; i++){
        text += "⬛"
      }
    }

    text += "\n9ps.github.io/statdle2/";

    navigator.clipboard.writeText(text);
    this.props.togglePopup(3);
  }

  render() {
    let stats = JSON.parse(localStorage.getItem("stats"));
    let content;

    if (this.props.ended) {
      let fillerText = "";
      if (this.props.win) {
        fillerText += this.props.history.length;
        fillerText += this.props.history.length === 1 ? " Guess" : " Guesses";
      } else {
        fillerText = DATA[this.props.targetCountry][0][1];
      }

      content = (
        <>
          <h2 className="guess-count">
            {fillerText}
          </h2>
          <button className="btn btn--wide btn--active" onClick={this.share}>
            Share
          </button>
          
          <button className="btn btn--wide btn--active" onClick={() => this.props.reset()}>Reset</button>
          <StatsDisplay stats={stats} />
          <WinCountries history={this.props.history} win={this.props.win} />
        </>
      );
    } else {
      content = (
        <>
          <StatsDisplay stats={stats} />
          <WinCountries history={this.props.history} win={false} />
          <p className="info__text">
            (finish playing the round for sharing options)
            
          </p>
        </>
      );
    }

    return (
      <FocusTrap>
        <div
          className={"modal-backing" +
            (this.props.special
              ? " modal-backing--special"
              : ""
            )}
          onClick={() => this.props.toggleModal()}
        >
          <div
            className={"modal" +
              (this.props.special
                ? " modal--special"
                : ""
              )}
            onClick={this.stopPropagation}
          >
            <div className="modal__title">
              <h2>Results</h2>
              <button className="btn btn--icon" onClick={() => this.props.toggleModal()}>
                <img className="icons" src={Close} alt="Close" aria-label="close" />
              </button>
            </div>
            <div className="modal__body">{content}
            
              <div style={{textAlign: "center", marginTop: "20px"}}>
                <label htmlFor="categoriesSelect">Number of categories (requires refresh):</label>
                <input type="number" id="categoriesSelect" name="categoriesSelect"
                  min="4" max="15" onChange={this.update}></input>
              </div>
            </div>

            
          </div>
        </div>
      </FocusTrap>
    );
  }
}

export default ModalWin;
