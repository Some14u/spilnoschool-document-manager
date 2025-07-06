const css = data.css;
const javaScript = data.javaScript;
const iframeResizerJavaScript = data.iframeResizerJavaScript;

data.html = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Document manager</title>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <style>
      ${css}
    </style>
  </head>
  <body>
    <svg style="display: none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <symbol id="add-audio" viewBox="0 0 200 200">
          <path
            fill="currentColor"
            d="M92.7 172.6v-15c-29-3.5-51.6-28-51.6-57.6V85.5a7.4 7.4 0 1 1 14.8 0v15a15.2 15.2 0 0 0 7.7 28.2h3.3a43 43 0 0 0 6.8 6.2v3.8a14.8 14.8 0 0 0 29 4.7A43.7 43.7 0 0 0 144 100V85.5c0-4 3.4-7.3 7.5-7.3 4 0 7.3 3.3 7.3 7.3V100c0 29.6-22.5 54-51.5 57.6v15h22c4 0 7.4 3.2 7.4 7.2s-3.3 7.3-7.3 7.3h-59c-4 0-7.2-3.2-7.3-7.3 0-4 3.3-7.2 7.4-7.2h22ZM100 13c16.3 0 29.5 13 29.5 29v58a28 28 0 0 1-1.6 9.3 15 15 0 0 0-14.4-10.9h-10.1v-10c0-8.3-6.6-15.1-14.8-15.1s-14.9 6.8-14.9 15.1v10h-3.1V42c0-16 13.2-29.1 29.4-29.1Z"
          />
          <path stroke="currentColor" stroke-linecap="round" stroke-width="14" d="M88.6 88.4v50.3m-25-25.1h49.9" />
        </symbol>
        <symbol id="add-link" viewBox="0 0 200 200">
          <path
            fill="currentColor"
            d="M88.7 136c4-4.1 10.8-4.2 15 0 4 4 4.1 10.8 0 15-7.6 7.8-15.5 17.6-25.6 21.9-14.4 6-29 4.6-42-8.5A41.8 41.8 0 0 1 36 109l22.5-22.8c.6 8.3 8 14.5 16.2 13.5L51 124a18.3 18.3 0 0 0 0 25.5c5 5 12.5 6.5 19 3.7 5.7-2.3 14.2-12.5 18.7-17.1ZM104 73.8c4.9 2 9.2 4.9 12.8 8.6a10.6 10.6 0 0 1 0 15 10.4 10.4 0 0 1-14.9 0c-4.2-4.3-10.3-6-16.2-4.8 2.9-5 2-11.8 2-17.4 5 0 11.9.7 16.3-1.4Zm-5-28.6 9.8-10a38.2 38.2 0 0 1 54.5 0c15 15.1 14.8 40 0 55.2L137 117.2a38.2 38.2 0 0 1-54.5 0c-4.1-4.2-4-10.9 0-15a10.5 10.5 0 0 1 15 0 17.2 17.2 0 0 0 24.6 0l26.3-26.7c6.8-7 6.8-18.4 0-25.4a17.4 17.4 0 0 0-24.7 0l-11 11.2A15 15 0 0 0 99 45.2Z"
          />
          <path fill="currentColor" d="M67.5 35.2a5.6 5.6 0 1 1 11.2 0H67.5Zm11.2 0V85H67.5V35.2h11.2Zm0 49.8c0 3.1-2.6 5.6-5.6 5.6s-5.6-2.5-5.6-5.6h11.2Z" />
          <path fill="currentColor" d="M48.4 65.8c-3 0-5.5-2.6-5.5-5.7s2.4-5.6 5.5-5.6v11.3Zm0-11.3h49.4v11.3H48.4V54.5Zm49.4 0a5.7 5.7 0 0 1 0 11.3V54.5Z" />
        </symbol>
        <symbol id="delete-cross" viewBox="0 0 20 20">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.9" d="m5.9 5.9 8.2 8.2m0-8.2-8.2 8.2" />
        </symbol>
        <symbol id="edit-pencil" viewBox="0 0 200 200">
          <path fill="currentColor" d="M9.6 149.5v35.2h37.7l111-104-37.6-35.4-111 104.2Zm177.8-96.1a9 9 0 0 0 0-13.4L164 18c-4-3.6-10-3.6-14 0l-18.5 17.3 37.7 35.2 18.3-17.1Z" />
        </symbol>
        <symbol id="edit-pencil-square" viewBox="0 0 200 200">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="20" d="M171 103.7v50.8c0 11.6-9.5 21.2-21 21.2H49c-11.5 0-21-9.6-21-21.2v-102a21 21 0 0 1 21-21.2h50.2" />
          <path
            fill="currentColor"
            d="m141.7 31.4 26.7 27-64.9 65.4a10.6 10.6 0 0 1-5.5 3l-22.1 4.4a5 5 0 0 1-5-1.5 5.5 5.5 0 0 1-1.5-5l4.4-22.3c.4-2.2 1.3-4 3-5.6l64.9-65.4ZM183 46.6a21.3 21.3 0 0 0 0-29.8 20.7 20.7 0 0 0-29.6 0l-5.1 5 29.5 29.9 5.1-5.1Z"
          />
        </symbol>
        <symbol id="doc-audio" viewBox="0 0 200 200">
          <path stroke="currentColor" fill="currentColor" stroke-linejoin="round" stroke-width="17" d="M30.6 74.4v51.2h28.2l45.2 34.2V40.2L58.8 74.4H30.6z" />
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="17" d="M132.2 80s11.3 5.8 11.3 20-11.3 20-11.3 20m11.3-74.1c22.6 11.4 34 28.5 34 54.1s-11.4 42.7-34 54.1" />
        </symbol>
        <symbol id="doc-image" viewBox="0 0 200 200">
          <path
            fill="currentColor"
            d="M18.7 44.7v110.6c0 10.3 2.1 12.3 12.2 12.3h138.2c10 0 12.2-1.9 12.2-12.3V44.7c0-10.1-2-12.3-12.2-12.3H30.9c-10 0-12.2 1.8-12.2 12.3Zm143.4 94.2H38c13.5-20 37.7-53.2 43.8-53.2 6 0 26 26.9 35.2 36.3 0 0 11.7-15.7 17.8-15.7 6.3 0 27.1 32.5 27.3 32.6Zm-36.5-69.6a15 15 0 1 1 30 0 15 15 0 1 1-30 0Z"
          />
        </symbol>
        <symbol id="doc-link" viewBox="0 0 200 200">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="21.5" d="m103.9 50.3 15-15.2a32 32 0 0 1 45.4 0h0a32.7 32.7 0 0 1 0 45.8l-30.1 30.4a32 32 0 0 1-45.4 0h0" />
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="21.5" d="m96.1 149.7-15 15.2a32 32 0 0 1-45.4 0h0a32.7 32.7 0 0 1 0-45.8l30.1-30.4a32 32 0 0 1 45.4 0h0" />
        </symbol>
        <symbol id="doc-text" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M6.25 2C5.01 2 4 3 4 4.25v15.5A2.25 2.25 0 0 0 6.25 22h11.5c1.24 0 2.25-1 2.25-2.25V8h-5.25a.75.75 0 0 1-.75-.75V2H6.25zm9.25.05V6.5h4.45a.74.74 0 0 0-.17-.28l-4-4a.75.75 0 0 0-.28-.17zM8.75 11h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5zm0 3h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5zm0 3h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5z"
          />
        </symbol>
        <symbol id="doc-unknown" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M6.29 1.94a2.28 2.28 0 0 0-2.27 2.28v15.6a2.25 2.25 0 0 0 2.27 2.24h11.46c1.24 0 2.22-.99 2.22-2.25V8h-5.2a.76.76 0 0 1-.75-.76v-5.3H6.29Zm4.52 9.55c0 .41-.34.76-.75.76s-.76-.35-.76-.76c0-1.6 1.25-2.55 2.8-2.59a2.38 2.38 0 0 1 2.52 2.24c.04 1.94-1.88 1.94-1.88 3.8 0 .43-.3.77-.72.77s-.76-.34-.76-.76c0-2.4 1.74-2.82 1.85-3.62.08-.57-.45-.95-.98-.95-.71.04-1.32.35-1.32 1.1Zm1.2 4.79c.42 0 .73.34.73.76s-.3.76-.72.76a.76.76 0 1 1 0-1.52Zm3.48-14.3v4.49h4.45a.61.61 0 0 0-.15-.27l-4-4.03a.82.82 0 0 0-.3-.19Z"
          />
        </symbol>
        <symbol id="doc-video" viewBox="0 0 200 200">
          <path
            fill="currentColor"
            d="M184.3 57.3a22 22 0 0 0-15.5-15.7C155 37.9 100 37.9 100 37.9s-55 0-68.8 3.7a22 22 0 0 0-15.5 15.7C12 71 12 100 12 100s0 28.9 3.7 42.7a22 22 0 0 0 15.5 15.7c13.8 3.7 68.8 3.7 68.8 3.7s55 0 68.8-3.7c7.6-2 13.5-8 15.5-15.7C188 129 188 100 188 100s0-28.9-3.7-42.7ZM86.6 124c-.9.6-1.9.6-2.8 0-1-.5-1.4-1.4-1.4-2.4V78.3c0-1 .5-2 1.4-2.4 1-.6 2-.6 2.8 0L124 97.5c.9.5 1.4 1.5 1.4 2.5s-.5 2-1.4 2.5L86.6 124Z"
          />
        </symbol>
      </defs>
    </svg>
    <div id="documentManagerHost"></div>
    <script>
      ${iframeResizerJavaScript}
    </script>
    <script>
	${javaScript}
    </script>
  </body>
</html>
`;
