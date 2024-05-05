import React, {useEffect, useState} from 'react';
import ResultCard from "./ResultCard";
import { Octokit, App } from "octokit";

const Results = (props) => {
    const [contributorPairs, setContributorPairs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const octokit = new Octokit({
        auth : "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"
    });

    const parseGitHubUrl = (url) => {
        // example: https://github.com/Rogan003/TravelTheWorld
        // https://github.com/Rogan003/NASPprojekat
        // https://github.com/Rogan003/Auto-skola
        const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(regex);
        if (match) {
            return { owner: match[1], repo: match[2] };
        } else {
            return { owner: null, repo: null };
        }
    }

   const getRepositoryInformation = async (info) => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        if (owner === null) return Promise.resolve(null);

        return octokit.request('GET /repos/{owner}/{repo}/{info}', {
            owner: owner,
            repo: repo,
            info: info
        }).then(response => {
            return response;
        }).catch(error => {
            console.error("Error loading repository:", error);
            return null;
        });
    }

    const getCommitFiles = async (commitSha) => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        return octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
            owner: owner,
            repo: repo,
            ref: commitSha
        }).then(response => {
            // Extract the list of files changed
            const filesChanged = response.data.files.map(file => file.filename);
            return filesChanged;
        }).catch(error => {
            console.error("Error fetching commit details:", error);
            return [];
        });
    };

    const getFilesAndContributors = async (commits) => {
        let filesAndContributors = {};

        for (const commit of commits.data) {
            const commitFiles = await getCommitFiles(commit.sha);

            commitFiles.forEach((filename) => {
                filesAndContributors[filename] = filesAndContributors[filename] || {};
                filesAndContributors[filename][commit.author.login] =
                    filesAndContributors[filename][commit.author.login] ? filesAndContributors[filename][commit.author.login] + 1 : 1;
            });
        }

        return filesAndContributors;
    };

    const calculateContributingPairs = async (filesAndContributors) => {
        let contributingPairs = {};

        for(const fileWithContributorsKey of Object.keys(filesAndContributors)) {
            const fileContributors = filesAndContributors[fileWithContributorsKey];

            const fileContributorsKeys = Object.keys(fileContributors);

            for (let i = 0; i < fileContributorsKeys.length; i++) {
                for(let j = i + 1; j < fileContributorsKeys.length; j++) {
                    const contributorOne = fileContributorsKeys[i];
                    const contributorTwo = fileContributorsKeys[j];

                    const contributorsKey = contributorOne + ';' + contributorTwo;

                    if (!contributingPairs.hasOwnProperty(contributorsKey))
                    {
                        contributingPairs[contributorsKey] = {};
                        contributingPairs[contributorsKey]["developer1"] = contributorOne;
                        contributingPairs[contributorsKey]["developer2"] = contributorTwo;
                    }

                    const commonFileContributions =
                        Math.min(filesAndContributors[fileWithContributorsKey][contributorOne],
                            filesAndContributors[fileWithContributorsKey][contributorTwo]);

                    contributingPairs[contributorsKey][fileContributors] =
                        contributingPairs[contributorsKey][fileContributors] ?
                            contributingPairs[contributorsKey][fileContributors]
                            + commonFileContributions : commonFileContributions;

                    contributingPairs[contributorsKey]["contributionsToTheSameFilesAndRepositories"] =
                        contributingPairs[contributorsKey]["contributionsToTheSameFilesAndRepositories"] ?
                            contributingPairs[contributorsKey]["contributionsToTheSameFilesAndRepositories"]
                            + commonFileContributions: commonFileContributions;
                }
            }
        }

        return contributingPairs;
    }

    const findTopContributingPairs = async () => {
        const commits = await getRepositoryInformation("commits");
        const contributors = await getRepositoryInformation("contributors");

        if(props.linkToRepository === "")
        {
            setErrorMessage("");
            return;
        }

        if(!commits)
        {
            setContributorPairs([]);
            setErrorMessage("Repository not found!");
            return;
        }

        if(commits.data.length === 0)
        {
            setContributorPairs([]);
            setErrorMessage("Repository has no commits!");
            return;
        }

        if(contributors.data.length < 2)
        {
            setContributorPairs([]);
            setErrorMessage("Repository has less than two contributors!");
            return;
        }

        setErrorMessage("");

        // algorithm
        const filesAndContributors= await getFilesAndContributors(commits);
        console.log(filesAndContributors);

        const contributingPairs = await calculateContributingPairs(filesAndContributors);

        console.log(contributingPairs);

        const topContributingPairs = Object.values(contributingPairs).sort((pairOne, pairTwo) =>
                pairTwo["contributionsToTheSameFilesAndRepositories"] - pairOne["contributionsToTheSameFilesAndRepositories"]);

        console.log(topContributingPairs);
        setContributorPairs(topContributingPairs);
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