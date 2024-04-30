import React from 'react';

const LinkInput = (props) => {
    return (
        <div className="linkInputDiv">
            <input className="linkInput" placeholder="Enter the link to the github repository..."
                   value = {props.inputText}
                   onChange={e => props.setInputText(e.target.value)} />
        </div>
    );
};

export default LinkInput;