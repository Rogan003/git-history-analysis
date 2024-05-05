import React from 'react';

const ContributorPairCard = (props) => {
    // variable that holds the info for the visibility of file contributions (initially hidden, activates on click)
    const [areFilesVisible, setAreFilesVisible] = React.useState(false);

    // displaying the card and its info
    return (
        <div className="contributingPairCard" onClick={() => setAreFilesVisible(!areFilesVisible)}>
            <span className="cardText">First developer: {props.pair.developer1}</span>
            <span className="cardText">Second developer: {props.pair.developer2}</span>
            <span className="cardText">Total contributions: {props.pair.contributionsToTheSameFilesAndRepositories}</span>
            <span className="cardClickLabel">{areFilesVisible ? "File contributions (min amount from both contributors), click to close:" :
            "Click to see file contributions"} </span>
            {
                areFilesVisible &&
                <div className="fileContributions">
                    {
                        Object.keys(props.pair).map(pairKey => {
                            if (pairKey !== "contributionsToTheSameFilesAndRepositories" &&
                                pairKey !== "developer1" && pairKey !== "developer2") {
                                return (
                                    <span className="cardText">{pairKey}: {props.pair[pairKey]}</span>
                                );
                            }
                        })
                    }
                </div>
            }
        </div>
    );
};

export default ContributorPairCard;