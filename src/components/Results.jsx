import React, {useEffect, useState} from 'react';
import ResultCard from "./ResultCard";
import { Octokit } from "octokit";

const Results = (props) => {
    const [contributorPairs, setContributorPairs] = useState([]);
    const [pageMessage, setPageMessage] = useState('');

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

    const getNextPageLink = async (linkHeader) => {
        if (!linkHeader) {
            return null;
        }

        // Split the Link header into separate links
        const links = linkHeader.split(', ');

        // Find the link with rel="next"
        const nextPageLink = links.find(link => link.includes('rel="next"'));

        if (!nextPageLink) {
            return null;
        }

        // Extract the URL from the link
        const match = nextPageLink.match(/<([^>]+)>/);
        if (!match) {
            return null;
        }

        return match[1];
    };

   const getRepositoryInformation = async (info) => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        if (owner === null) return Promise.resolve(null);

        let nextPage = `GET /repos/${owner}/${repo}/${info}`;
        let repositoryInformation = [];

        while(nextPage)
        {
            await octokit.request(nextPage, {
                per_page: 100
            }).then(async response => {
                repositoryInformation = repositoryInformation.concat(response.data);
                nextPage = await getNextPageLink(response.headers.link);
            }).catch(error => {
                console.error("Error loading repository:", error);
                return null;
            });
        }

        return repositoryInformation;
    }

    const getCommitFiles = async (commitSha) => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        let nextPage = `GET /repos/${owner}/${repo}/commits/${commitSha}`;
        let allFiles = [];

        while(nextPage)
        {
            await octokit.request(nextPage, {
                per_page: 100
            }).then(async response => {
                // Extract the list of files changed
                const filesChanged = response.data.files.map(file => file.filename);
                allFiles = allFiles.concat(filesChanged);
                nextPage = await getNextPageLink(response.headers.link);
            }).catch(error => {
                console.error("Error fetching commit details:", error);
                return [];
            });
        }

        return allFiles;
    };

    const getFilesAndContributors = async (commits) => {
        let filesAndContributors = {};

        for (const commit of commits) {
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

                    let contributorsKey = contributorOne + ';' + contributorTwo;
                    const contributorsKeyReverse = contributorTwo + ';' + contributorOne;

                    if(!contributingPairs.hasOwnProperty(contributorsKey) && contributingPairs.hasOwnProperty(contributorsKeyReverse))
                    {
                        contributorsKey = contributorsKeyReverse;
                    }

                    if (!contributingPairs.hasOwnProperty(contributorsKey))
                    {
                        contributingPairs[contributorsKey] = {};
                        contributingPairs[contributorsKey]["developer1"] = contributorOne;
                        contributingPairs[contributorsKey]["developer2"] = contributorTwo;
                    }

                    const commonFileContributions =
                        Math.min(filesAndContributors[fileWithContributorsKey][contributorOne],
                            filesAndContributors[fileWithContributorsKey][contributorTwo]);

                    contributingPairs[contributorsKey][fileWithContributorsKey] =
                        contributingPairs[contributorsKey][fileWithContributorsKey] ?
                            contributingPairs[contributorsKey][fileWithContributorsKey]
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
            setPageMessage("");
            return;
        }

        if(!commits)
        {
            setContributorPairs([]);
            setPageMessage("Repository not found!");
            return;
        }

        if(commits.length === 0)
        {
            setContributorPairs([]);
            setPageMessage("Repository has no commits!");
            return;
        }

        if(contributors.length < 2)
        {
            setContributorPairs([]);
            setPageMessage("Repository has less than two contributors!");
            return;
        }

        // algorithm
        const filesAndContributors= await getFilesAndContributors(commits);
        console.log(filesAndContributors);

        const contributingPairs = await calculateContributingPairs(filesAndContributors);


        const topContributingPairs = Object.values(contributingPairs).sort((pairOne, pairTwo) =>
                pairTwo["contributionsToTheSameFilesAndRepositories"] - pairOne["contributionsToTheSameFilesAndRepositories"]);

        setPageMessage("");
        setContributorPairs(topContributingPairs);
    }

    useEffect(() => {
        setContributorPairs([]);
        setPageMessage("Loading...");
        findTopContributingPairs();
    }, [props.linkToRepository]);

    return (
        <div className = "resultsContainer">
            {
                contributorPairs.length === 0 ?
                    <span className = {pageMessage === "Loading..." ? "pageMsg" : "errMsg"}>
                        {pageMessage}
                    </span> :
                contributorPairs.map((pair) => {
                    return (<ResultCard pair = {pair} />);
                })
            }
        </div>
    );
};

export default Results;