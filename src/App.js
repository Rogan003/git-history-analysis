import './style/App.css';
import LinkInput from "./components/LinkInput";
import Results from "./components/Results";
import {useState} from "react";

function App() {
    const [inputText, setInputText] = useState("")

  return (
    <div className = "App">
        <LinkInput inputText={inputText} setInputText={setInputText} />
        <Results linkToRepository = {inputText} />
    </div>
  );
}

export default App;
