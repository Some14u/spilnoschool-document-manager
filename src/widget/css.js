data.css = `
      html {
        overflow: hidden;
      }
      body {
        font-family: sans-serif;
        --primaryColor: #F88010;
        --secondaryColor: #666666;
        --accentColor: #99C832;
        --textColorDark: #333;
        --textColorLight: #777;

        margin: 0;
      }
      .file-drop-area {
        position: relative;

        display: grid;
  		grid-template: "instruction buttons" "file-items file-items";
    	grid-template-columns: none;
  		grid-template-columns: 1fr minmax(0px, min-content);

        border: 1px dashed color-mix(in oklab, var(--secondaryColor), transparent 80%);
        background-color: color-mix(in oklab, var(--secondaryColor), transparent 96%);
        padding: 16px;
        transition: border-color 0.2s, background-color 0.2s;
      }
      .file-drop-area.dragover {
        border-color: var(--accentColor);
        background-color: color-mix(in oklab, var(--accentColor), transparent 90%);
      }
      .file-drop-instruction {
      	grid-area: instruction;
        text-align: center;
        font-size: 15px;
        line-height: 22px;
        color: var(--textColorDark);
        user-select: none;
      }
      .file-drop-instruction a {
        color: var(--primaryColor);
        text-decoration: none;
        cursor: pointer;
        white-space: pre;
      }
      .file-drop-instruction a:hover,
      .file-drop-instruction a:focus {
        text-decoration: underline;
      }
      .file-items {
        grid-area: file-items;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        overflow: hidden;
      }
      .file-items:not(:empty) {
      	margin-top: 16px;
      }
      .file-item {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 120px;
        max-width: 400px;
        border: 2px solid color-mix(in oklab, var(--secondaryColor), transparent 80%);
        padding: 8px;
        background: #fff;
        cursor: grab;
        user-select: none;
        transition: border-color 0.2s;
        gap: 8px;
      }

      .file-item:hover {
        border-color: var(--primaryColor);
      }

      .file-item:hover .file-content {
        color: var(--textColorDark);
      }

      .file-item:hover .file-icon {
        color: var(--primaryColor);
        transform: scale(1.3);
      }

      .file-item:active {
        cursor: grabbing;
      }
      .file-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        color: var(--textColorLight);
        transition: color 0.2s, transform 0.2s cubic-bezier(.17,.84,.44,1);
      }
      .file-icon svg {
        width: 24px;
        height: 24px;
      }
      .file-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: var(--textColorLight);
        transition: color 0.2s;
      }
      .file-name {
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .description {
        font-style: italic;
        font-size: 0.8rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 210px;
      }
      .mock-description {
        opacity: 0.4;
      }
      .action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        color: var(--textColorLight);
        flex-shrink: 0;
        transition: color 0.2s;
      }
      .action-button:hover {
        color: var(--primaryColor);
      }
      .action-button svg {
        width: 18px;
        height: 18px;
      }
      .sortable-ghost {
        opacity: 0.4 !important;
      }
      .file-drop-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.7);
        z-index: 20;
      }
      .extra-buttons {
        grid-area: buttons;
        margin: -5px -5px -5px 7px;
        display: flex;
        gap: 8px;
      }
      .add-web-button,
      .add-audio-button {
        width: 32px;
        height: 32px;
        border: none;
        padding: 4px;
        cursor: pointer;
        background: transparent;
        color: var(--primaryColor);
        transition: background-color 0.2s, color 0.2s;
      }
      .add-web-button:hover,
      .add-web-button:focus,
      .add-audio-button:hover,
      .add-audio-button:focus {
        background: var(--primaryColor);
        color: #fff;
      }
      .add-web-button svg,
      .add-audio-button svg {
        width: 24px;
        height: 24px;
      }
`;
