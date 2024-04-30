import React, {useEffect, useState} from 'react';
import ResultCard from "./ResultCard";

const Results = (props) => {
    const [contributorPairs, setContributorPairs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const findTopContributingPairs = () => {
        setContributorPairs([
            {
                "developer1" : "Rogan003",
                "developer2" : "TacTac",
                "contributionsToTheSameFilesAndRepositories" : 20
            },
            {
                "developer1" : "dev1",
                "developer2" : "dev2",
                "contributionsToTheSameFilesAndRepositories" : 15
            },
            {
                "developer1" : "dev1",
                "developer2" : "dev3",
                "contributionsToTheSameFilesAndRepositories" : 12
            }
        ]);

        if (props.linkToRepository === "hey")
        {
            setContributorPairs([]);
            setErrorMessage("Repository not found!")
        }

        // other possible errors:
        // No commits found at the repository + props.linkToRepository!
        // Less than two developers contributed to the repository!
    }

    useEffect(() => {
        findTopContributingPairs();
    }, [props.linkToRepository]);

    return (
        <div className = "resultsContainer">
            {
                contributorPairs.length === 0 ?
                    <span className = "errorMsg">
                        {errorMessage}
                    </span> :
                contributorPairs.map((pair) => {
                    return (<ResultCard pair = {pair} />);
                })
            }
        </div>
    );
};

export default Results;