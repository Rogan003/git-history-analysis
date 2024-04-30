import React from 'react';

const ResultCard = (props) => {
    return (
        <div className="contributingPairCard">
            <span className="cardText">First developer: {props.pair.developer1}</span>
            <span className="cardText">Second developer: {props.pair.developer2}</span>
            <span className="cardText">Total contributions: {props.pair.contributionsToTheSameFilesAndRepositories}</span>
        </div>
    );
};

export default ResultCard;