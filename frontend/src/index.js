import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Game extends React.Component {
    constructor(props) {
        super(props);

        const letters = ['x', 'a', 'b', 'e', 'x', 'a'];
        this.state = {
            letters,
            used: new Array(letters.length).fill(false),
            endTime: new Date(),
            word: [],
            values: {
                a: 1,
                b: 2,
            }
        };
    }

    getValue(letter) {
        if (!letter) {
            return 0;
        }
        const values = this.state.values;
        if (values.hasOwnProperty(letter)) {
            return values[letter];
        }
        return 3;
    }

    setLetter(i) {
        const letters = this.state.letters;
        const used = this.state.used.slice();
        if (used[i]) {
            return;
        }
        const word = this.state.word.slice();
        used[i] = true;
        word.push(letters[i]);

        this.setState({
            used,
            word,
        });
    }

    unsetLetter(k) {
        const word = this.state.word.slice();
        const used = this.state.used.slice();
        const letters = this.state.letters;
        if (!word[k]) {
            return;
        }
        let i = -1;
        do {
            i = letters.indexOf(word[k], i + 1);
        } while (i >= 0 && !used[i]);
        if (i < 0) {
            return;
        }

        used[i] = false;
        word.splice(k, 1);
        this.setState({used, word});
    }

    calculateWord() {
        const word = this.state.word;
        let value = 0;
        for(let k = 0; k < word.length; ++k) {
            value += this.getValue(word[k]);
        }
        return value;
    }

    render() {
        const letters = this.state.letters;
        const word = this.state.word;
        const used = this.state.used;
        const letterRow = letters.map((letter, i) => {
            return (
                <Letter
                    key={i}
                    letter={letter}
                    used={used[i]}
                    value={this.getValue(letter)}
                    onClick={() => this.setLetter(i)}
                />
            );
        });
        const wordRow = word.map((letter, k) => {
            return (
                <Letter
                    key={k}
                    letter={letter}
                    value={this.getValue(letter)}
                    onClick={() => this.unsetLetter(k)}
                />
            )
        });
        const wordValue = this.calculateWord();
        return (
            <div>
                <div className="letter-row">
                    {letterRow}
                </div>
                <div className="word-row">
                    {wordRow}
                </div>
                <div>
                    Score: {wordValue}
                </div>
            </div>
        );
    }
}

class Letter extends React.Component {
    render() {
        return (
            <div className='letter'>
                <button className="letter-button" onClick={() => this.props.onClick()} disabled={this.props.used}>
                    {this.props.letter}
                </button>
                <div className="letter-value">
                    {this.props.value}
                </div>
            </div>
        );
    }
}



// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
