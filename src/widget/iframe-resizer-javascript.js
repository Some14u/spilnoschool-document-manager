function initIframeResizer(parentOrigin = '*') {
  // Считает полную ширину/высоту контента вместе с margin'ами
  const getFullDimensions = () => {
    const body = document.body;
    const style = window.getComputedStyle(body);
    const marginLeft = parseInt(style.marginLeft, 10) || 0;
    const marginRight = parseInt(style.marginRight, 10) || 0;
    const marginTop = parseInt(style.marginTop, 10) || 0;
    const marginBottom = parseInt(style.marginBottom, 10) || 0;

    const fullWidth = body.scrollWidth + marginLeft + marginRight;
    const fullHeight = body.scrollHeight + marginTop + marginBottom;

    return { fullWidth, fullHeight };
  };

  const oldDimensions = getFullDimensions();

  // Шлёт размеры родителю
  const sendSizeToParent = () => {
    const newDimensions = getFullDimensions();

    if (oldDimensions.fullWidth === newDimensions.fullWidth && oldDimensions.fullHeight === newDimensions.fullHeight) {
      return;
    }

    Object.assign(oldDimensions, newDimensions);
    window.parent.postMessage(
      {
        type: 'resize',
        payload: {
          width: newDimensions.fullWidth,
          height: newDimensions.fullHeight
        }
      },
      parentOrigin
    );
  };

  // Первоначальный пост
  sendSizeToParent();

  // При изменении размеров окна внутри iframe
  window.addEventListener('resize', sendSizeToParent);

  // При динамических изменениях контента
  const observer = new ResizeObserver(sendSizeToParent);
  observer.observe(document.body);
}

data.iframeResizerJavaScript = `(${initIframeResizer.toString()})();`;
