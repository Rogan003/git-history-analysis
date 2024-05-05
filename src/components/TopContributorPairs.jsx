import React, {useEffect, useState} from 'react';
import ContributorPairCard from "./ContributorPairCard";
import { Octokit } from "octokit";

const TopContributorPairs = (props) => {
    // contributor pairs to output
    const [contributorPairs, setContributorPairs] = useState([]);
    // message to output to the screen about errors or loading state
    const [pageMessage, setPageMessage] = useState('');

    // octokit object
    const octokit = new Octokit({
        auth : "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"
    });

    // function to extract owner and repository from github link
    const parseGitHubUrl = (url) => {
        // example: https://github.com/Rogan003/TravelTheWorld
        // https://github.com/Rogan003/NASPprojekat
        // https://github.com/Rogan003/Auto-skola
        const ownerRepoRegex = /github\.com\/([^\/]+)\/([^\/]+)/;

        // match the url with regex, find and return the owner and repository
        const match = url.match(ownerRepoRegex);

        if (match) {
            return { owner: match[1], repo: match[2] };
        } else {
            return { owner: null, repo: null };
        }
    }

    // octokit always returns a fixed amount of objects requested, all other objects are on other pages
    // this function is used to get the link to the next page
    const getNextPageLink = async (linkHeader) => {
        if (!linkHeader) {
            return null;
        }

        // Split the Link header into separate links
        const links = linkHeader.split(', ');

        // Find the link
        const nextPageLink = links.find(link => link.includes('rel="next"'));

        // if there is no link
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

    // function to get repository information through octokit request, like commits and contributors
   const getRepositoryInformation = async (info) => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        // return null if you can't get owner and repository (link is invalid)
        if (owner === null) return Promise.resolve(null);


        // algorithm for getting all the information through all pages and returning all repository information
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

    // function to get all created/modified/deleted file names from a commit
    const getCommitFiles = async (commitSha) => {
        const { owner, repo } = parseGitHubUrl(props.linkToRepository);

        // algorithm to get and return all the file names from all pages of octokit request of the given commit
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

    // function to get all files, their contributors and their "amount of contributing" to that file, from a repository
    // creates a data structure that has a key that is a filename, and a value that is an object
    // that has contributors and amount of contributions that they made to that file
    // e.g. { "file1" : {"cont1" : 2, "cont2" : 4}}
    const getFilesAndContributors = async (commits) => {
        let filesAndContributors = {};

        // all of this is done asynchronously, because it is much faster that way
        const filesPromises = commits.map(async (commit) => {
            const contributor = commit.author.login;
            const commitFiles = await getCommitFiles(commit.sha);

            // Update filesAndContributors object
            commitFiles.forEach((filename) => {
                filesAndContributors[filename] = filesAndContributors[filename] || {};
                filesAndContributors[filename][contributor] =
                    filesAndContributors[filename][contributor] ? filesAndContributors[filename][contributor] + 1 : 1;
            });
        });

        // Wait for all promises to resolve
        await Promise.all(filesPromises);

        return filesAndContributors;
    };

    // function that is the algorithm for calculating and creating all contributor pairs
    // from the previously made structure with files and their contributors
    // that is all pairs of contributors that contributed to the same file with any commit
    // and also count the amount of commits that they made to that file
    // (minimum number of commits to that file between the two of them)
    // and also total common contributions
    const calculateContributingPairs = async (filesAndContributors) => {
        let contributingPairs = {};

        // loop through all files with their contributors
        // and then through all contributors of those files and creating pairs with their informations
        // that includes amount of total common contributions between them, names of developers and
        // amount of common contributions to the current iterated file
        for(const filename of Object.keys(filesAndContributors)) {
            const fileContributors = filesAndContributors[filename];

            const fileContributorsNames = Object.keys(fileContributors);

            for (let i = 0; i < fileContributorsNames.length; i++) {
                for(let j = i + 1; j < fileContributorsNames.length; j++) {
                    const contributorOne = fileContributorsNames[i];
                    const contributorTwo = fileContributorsNames[j];

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
                        Math.min(filesAndContributors[filename][contributorOne],
                            filesAndContributors[filename][contributorTwo]);

                    contributingPairs[contributorsKey][filename] =
                        contributingPairs[contributorsKey][filename] ?
                            contributingPairs[contributorsKey][filename]
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

    // Function that combines everything
    // Uses all functions that are written above, sorts the found contributing pairs and sets them for display
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

        // algorithm start
        const filesAndContributors= await getFilesAndContributors(commits);
        console.log(filesAndContributors);

        const contributingPairs = await calculateContributingPairs(filesAndContributors);


        const topContributingPairs = Object.values(contributingPairs).sort((pairOne, pairTwo) =>
                pairTwo["contributionsToTheSameFilesAndRepositories"] - pairOne["contributionsToTheSameFilesAndRepositories"]);

        setPageMessage("");
        setContributorPairs(topContributingPairs);
    }

    // useEffect, activates every time the input is changed
    useEffect(() => {
        // shows loading before running the algorithm
        setContributorPairs([]);
        setPageMessage("Loading...");
        // running the algorithm, sets up and displays the results
        findTopContributingPairs();
    }, [props.linkToRepository]);

    return (
        <div className = "resultsContainer">
            {
                // if no pairs are found, display the page message
                // otherwise display the found pairs through contributor pair cards
                contributorPairs.length === 0 ?
                    <span className = {pageMessage === "Loading..." ? "pageMsg" : "errMsg"}>
                        {pageMessage}
                    </span> :
                contributorPairs.map((pair) => {
                    return (<ContributorPairCard pair = {pair} />);
                })
            }
        </div>
    );
};

export default TopContributorPairs;