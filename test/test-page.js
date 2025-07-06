let currentDocuments = [];

function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

function updateDocumentList() {
    const listContainer = document.getElementById('documentList');
    const documentsContainer = document.getElementById('documents');

    if (currentDocuments.length === 0) {
        listContainer.style.display = 'none';
        return;
    }

    listContainer.style.display = 'block';
    documentsContainer.innerHTML = currentDocuments.map((doc, index) =>
        `<div class="document-item">
            <strong>${index + 1}.</strong> ${doc.description || doc.name || 'Документ'}
            <br><small>${doc.format || 'auto'} - ${doc.url.substring(0, 60)}${doc.url.length > 60 ? '...' : ''}</small>
        </div>`
    ).join('');
}

function sendToWidget(type, payload) {
    const iframe = document.getElementById('widgetFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: type,
            payload: payload
        }, '*');
    }
}

function addSampleDocuments() {
    const basePath = 'https://raw.githubusercontent.com/Some14u/spilnoschool-document-viewer/main/public/assets/';
    currentDocuments = [
        {
            url: basePath + "sample.svg",
            fileName: "sample.svg",
            description: "Локальный SVG файл",
            format: "image/svg+xml"
        },
        {
            url: "/assets/sample.pdf",
            fileName: "sample.pdf", 
            description: "Локальный PDF документ",
            format: "application/pdf"
        },
        {
            url: basePath + "sample1.docx",
            fileName: "sample1.docx",
            description: "Word документ (DOCX)",
            format: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        },
        {
            url: basePath + "sample2.xlsx",
            fileName: "sample2.xlsx",
            description: "Excel таблица (XLSX)",
            format: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        },
        {
            url: basePath + "React-utf8.txt",
            fileName: "React-utf8.txt",
            description: "Текстовый файл (UTF-8)",
            format: "text/plain"
        }
    ];

    sendToWidget('changeDocuments', {
        documents: currentDocuments
    });

    updateDocumentList();
    showStatus(`Добавлено ${currentDocuments.length} тестовых документов`);
}

function addImageDocuments() {
    currentDocuments = [
        {
            url: "https://picsum.photos/800/600?random=1",
            fileName: "random-image-1.jpg",
            description: "Случайное изображение 1",
            format: "image/jpeg"
        },
        {
            url: "https://picsum.photos/800/600?random=2",
            fileName: "random-image-2.jpg",
            description: "Случайное изображение 2",
            format: "image/jpeg"
        },
        {
            url: "https://picsum.photos/800/600?random=3",
            fileName: "random-image-3.jpg",
            description: "Случайное изображение 3",
            format: "image/jpeg"
        }
    ];

    sendToWidget('changeDocuments', {
        documents: currentDocuments
    });

    updateDocumentList();
    showStatus(`Добавлено ${currentDocuments.length} изображений`);
}

function addVideoDocuments() {
    const basePath = 'https://raw.githubusercontent.com/Some14u/spilnoschool-document-viewer/main/public/assets/';
    currentDocuments = [
        {
            url: basePath + "clipsave.net-.mp4",
            fileName: "sample-video.mp4",
            description: "Видео файл (MP4)",
            format: "video/mp4"
        },
        {
            url: basePath + "file_example_MP3_700KB.mp3",
            fileName: "sample-audio.mp3",
            description: "Аудио файл (MP3)",
            format: "audio/mpeg"
        }
    ];

    sendToWidget('changeDocuments', {
        documents: currentDocuments
    });

    updateDocumentList();
    showStatus(`Добавлено ${currentDocuments.length} медиа файлов`);
}

function clearDocuments() {
    currentDocuments = [];

    sendToWidget('changeDocuments', {
        documents: []
    });

    updateDocumentList();
    showStatus('Все документы удалены', 'error');
}

function logMessage(message, data = null) {
    console.log(`[Test Page] ${message}`, data || '');
    showStatus(message);
}

window.addEventListener('message', function(event) {
    if (event.data === 'reload-widget') {
        reloadWidget();
        return;
    }

    const iframe = document.getElementById('widgetFrame');
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'resize':
                if (event.data.payload && event.data.payload.height) {
                    iframe.style.height = event.data.payload.height + 'px';
                    logMessage('Размер iframe изменен по высоте:', event.data.payload.height + 'px');
                }
                break;

            case 'uploadFileRequest':
                logMessage('Запрос загрузки файла:', event.data.payload);
                setTimeout(() => {
                    iframe.contentWindow.postMessage({
                        type: 'fileUploaded',
                        payload: {
                            requestId: event.data.payload.requestId,
                            fileData: {
                                data: {
                                    title: event.data.payload.file.name,
                                    type: event.data.payload.file.type || 'application/octet-stream',
                                    fileName: 'c930f8c7-c066-49bc-832c-f698ad08ffa5/2025/6/29/uploaded_' + Date.now(),
                                    size: event.data.payload.file.size,
                                    userId: 197861,
                                    accId: "c930f8c7-c066-49bc-832c-f698ad08ffa5",
                                    id: Math.floor(Math.random() * 1000000)
                                }
                            }
                        }
                    }, '*');
                }, 1000);
                break;

            case 'documentsChanged':
                logMessage('Документы изменены:', event.data.payload);
                if (event.data.payload && event.data.payload.documents) {
                    currentDocuments = event.data.payload.documents;
                    updateDocumentList();
                }
                break;

            case 'editDocumentRequest':
                logMessage('Запрос редактирования документа:', event.data.payload);
                break;

            case 'addWebResourceRequest':
                logMessage('Запрос добавления веб-ресурса:', event.data.payload);
                if (event.data.payload && event.data.payload.documents) {
                    currentDocuments = event.data.payload.documents;
                    updateDocumentList();
                    console.log('Updated currentDocuments from widget payload:', currentDocuments.length, 'documents');
                } else {
                    console.log('No documents array found in payload');
                }
                showWebDocumentDialog();
                break;

            case 'addAudioRecordRequest':
                logMessage('Запрос добавления аудиозаписи:', event.data.payload);
                break;

            default:
                console.log('[Test Page] Неизвестное сообщение:', event.data);
                break;
        }
    }
});

function checkBuildStatus() {
    showWidget();
}

function showWidget() {
    const iframe = document.getElementById('widgetFrame');
    const errorDiv = document.getElementById('buildError');

    iframe.style.display = 'block';
    errorDiv.style.display = 'none';
}

function retryBuild() {
    showStatus('Перезагрузка виджета...', 'success');
    const iframe = document.getElementById('widgetFrame');
    iframe.src = iframe.src + '?t=' + Date.now();

    setTimeout(checkBuildStatus, 1000);
}

function reloadWidget() {
    const iframe = document.getElementById('widgetFrame');
    iframe.src = iframe.src + '?t=' + Date.now();
    showStatus('Виджет перезагружен');

    setTimeout(checkBuildStatus, 1000);
}

function showWebDocumentDialog() {
    const modal = document.getElementById('webDocumentModal');
    const urlInput = document.getElementById('documentUrl');
    const descriptionInput = document.getElementById('documentDescription');
    
    urlInput.value = '';
    descriptionInput.value = '';
    
    modal.style.display = 'flex';
    
    setTimeout(() => urlInput.focus(), 100);
}

function hideWebDocumentDialog() {
    const modal = document.getElementById('webDocumentModal');
    modal.style.display = 'none';
}

function submitWebDocument() {
    const urlInput = document.getElementById('documentUrl');
    const descriptionInput = document.getElementById('documentDescription');
    
    const url = urlInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!url) {
        showStatus('Введите URL документа', 'error');
        return;
    }
    
    const newDocument = {
        url: url,
        description: description || url,
        format: getFormatFromUrl(url)
    };
    
    currentDocuments.push(newDocument);
    
    sendToWidget('changeDocuments', {
        documents: currentDocuments
    });
    
    updateDocumentList();
    
    hideWebDocumentDialog();
    
    showStatus(`Добавлен веб-документ: ${newDocument.description}`);
}

function extractFileNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const fileName = pathname.split('/').pop();
        return fileName || 'web-document';
    } catch (e) {
        return 'web-document';
    }
}

function getFormatFromUrl(url) {
    const extension = url.split('.').pop().toLowerCase();
    const formatMap = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg'
    };
    return formatMap[extension] || 'text/html';
}

window.addEventListener('load', function() {
    showStatus('Тестовая страница загружена. Проверка статуса сборки виджета...');
    checkBuildStatus();
});
