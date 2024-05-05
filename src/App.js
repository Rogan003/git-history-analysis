import './style/App.css';
import LinkInput from "./components/LinkInput";
import TopContributorPairs from "./components/TopContributorPairs";
import {useState} from "react";

function App() {
    // variable that holds the input link
    const [inputText, setInputText] = useState("")

    // display of the app, input link and results of the algorithm (contributor pairs or messages)
  return (
    <div className = "App">
        <LinkInput inputText={inputText} setInputText={setInputText} />
        <TopContributorPairs linkToRepository = {inputText} />
    </div>
  );
}

export default App;
