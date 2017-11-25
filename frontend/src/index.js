import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Game extends React.Component {
    constructor(props) {
        super(props);

        const letters = ['x', 'a', 'b', 'l', 'x', 'a', 'e'];
        this.state = {
            letters,
            used: new Array(letters.length).fill(false),
            endTime: new Date(),
            word: [],
            values: {
                A: 3,
                B: 3,
                C: 3,
                D: 2,
                E: 2,
                F: 3,
                G: 1,
                H: 2,
                I: 1,
                J: 5,
                K: 3,
                L: 1,
                M: 3,
                N: 2,
                O: 1,
                P: 3,
                Q: 7,
                R: 3,
                S: 1,
                T: 1,
                U: 1,
                V: 5,
                W: 3,
                X: 7,
                Y: 7,
                Z: 3,
            }
        };
    }

    getValue(letter) {
        if (typeof(letter) !== 'string') {
            return 0;
        }
        letter = letter.toUpperCase();
        const values = this.state.values;
        if (values.hasOwnProperty(letter)) {
            return values[letter];
        }
        return 0;
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
        for (let k = 0; k < word.length; ++k) {
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
            <div className="game">
                <div className="letter-row">
                    {letterRow}
                </div>
                <div className="score-row">
                    Score: {wordValue}
                </div>
                <div className="word-row">
                    {wordRow}
                </div>
            </div>
        );
    }
}

class Letter extends React.Component {
    render() {
        const classNames = ['letter', 'value-' + this.props.value];
        return (
            <button
                className={classNames.join(' ')}
                onClick={() => this.props.onClick()}
                disabled={this.props.used}>
                <div className="letter-display">
                    {this.props.letter}
                </div>
                <div className="letter-value">{this.props.value}</div>
                <div className="letter-value right">{this.props.value}</div>
            </button>
        );
    }
}

// ========================================

ReactDOM.render(
    <Game/>,
    document.getElementById('root')
);
