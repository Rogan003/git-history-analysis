import React, {useEffect, useState} from 'react';
import ResultCard from "./ResultCard";
import { Octokit, App } from "octokit";

const Results = (props) => {
    const [contributorPairs, setContributorPairs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const octokit = new Octokit();

    const parseGitHubUrl = (url) => {
        // example: https://github.com/Rogan003/TravelTheWorld
        const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(regex);
        if (match) {
            return { owner: match[1], repo: match[2] };
        } else {
            return { owner: null, repo: null };
        }
    }

    const getRepository = () => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        if (owner === null) return Promise.resolve(null);

        return octokit.request('GET /repos/{owner}/{repo}', {
            owner: owner,
            repo: repo
        }).then(response => {
            // Log the repository information
            console.log("Repository Information:");
            console.log("Name:", response.data.name);
            console.log("Description:", response.data.description);
            console.log("URL:", response.data.html_url);
            return response.data;
        }).catch(error => {
            console.error("Error loading repository:", error);
            return null;
        });
    }

    const findTopContributingPairs = () => {
        getRepository().then((repository) => {
            if(!repository && props.linkToRepository !== "")
            {
                setContributorPairs([]);
                setErrorMessage("Repository not found!");
                return;
            }

            setErrorMessage("");

            // other possible errors:
            // No commits found at the repository + props.linkToRepository!
            // Less than two developers contributed to the repository!
        });
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