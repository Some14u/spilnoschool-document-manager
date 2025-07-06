const documents = data.__request.query_params?.documents ? JSON.parse(decodeURIComponent(data.__request.query_params.documents)) : [];
const config = data.__request.query_params?.config ? JSON.parse(decodeURIComponent(data.__request.query_params.config)) : {};




function script(documents, config) {
  class DocumentManager {
    constructor(rootEl, documents, config) {
      this.rootEl = rootEl;
      this.cfg = Object.assign({
        canDelete: true,
        canReorder: true,
        canEdit: true,
        showDescription: true,
        showDocumentIcon: true,
        showMenuPerDocument: true,
        canClick: true,
        fileLimit: Infinity,
        mimeTypes: [],
        fileSizeLimit: Infinity,
        showAddAudioRecordButton: true,
        showAddWebResourceButton: true,
        relayToComponentId: undefined,
        localization: {
          headerMessage: "Перетаскивайте документы в эту область, или {{выберите на носителе}}",
          defaultDescriptionMask: "Документ №{{n}}",
          fileLimitExceeded: "Нельзя добавить более {{limit}} документов.",
          uploadError: "Ошибка при добавлении документа {{name}}.",
        },
      },
        config
      );
      // Track upload requests by requestId
      this.pendingRequests = new Set();
      this.uploadResults = {};
      
      // Initialize internal documents array with UUID management
      this.documents = this.ensureDocumentIds(documents || []);

      this.renderSkeleton();
      this.bindStaticEvents();
      this.relayToComponentSnippet = this.cfg.relayToComponentId ? {
        relayToComponentId: this.cfg.relayToComponentId
      } : {};
      if (this.cfg.canReorder) this.initSortable();
      window.addEventListener("message", this.onHostMessage.bind(this));

      if (this.documents && this.documents.length > 0) {
        this.renderInitialDocuments();
      }
    }

    ensureDocumentIds(docs) {
      return docs.map(doc => ({
        ...doc,
        id: doc.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "doc_" + Date.now() + "_" + Math.random().toString(16).slice(2))
      }));
    }

    findDocumentById(id) {
      return this.documents.find(doc => doc.id === id);
    }

    updateDocumentInArray(id, updates) {
      const index = this.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        this.documents[index] = { ...this.documents[index], ...updates };
        return this.documents[index];
      }
      return null;
    }

    removeDocumentFromArray(id) {
      const index = this.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        const removedDoc = this.documents[index];
        this.documents.splice(index, 1);
        return removedDoc;
      }
      return null;
    }

    renderSkeleton() {
      // Clear existing content
      while (this.rootEl.firstChild) {
        this.rootEl.removeChild(this.rootEl.firstChild);
      }
      const {
        headerMessage
      } = this.cfg.localization;
      const [before, rest] = headerMessage.split("{{");
      const [linkText, after] = rest.split("}}");

      // File drop area
      const dropArea = document.createElement("div");
      dropArea.className = "file-drop-area";
      this.fileDropArea = dropArea;

      // Instruction text with link
      const instruction = document.createElement("div");
      instruction.className = "file-drop-instruction";
      instruction.appendChild(document.createTextNode(before));
      const link = document.createElement("a");
      link.id = "fileSelectLink";
      link.href = "#";
      link.textContent = linkText;
      instruction.appendChild(link);
      instruction.appendChild(document.createTextNode(after));
      dropArea.appendChild(instruction);

      // Extra buttons container
      const extraButtons = document.createElement("div");
      extraButtons.className = "extra-buttons";

      if (this.cfg.showAddAudioRecordButton) {
        const audioBtn = document.createElement("button");
        audioBtn.id = "addAudioBtn";
        audioBtn.className = "add-audio-button";
        audioBtn.setAttribute("aria-label", "Add audio recording");
        audioBtn.innerHTML = '<svg viewBox="0 0 200 200"><use xlink:href="#add-audio"/></svg>';
        extraButtons.appendChild(audioBtn);
        this.addAudioBtn = audioBtn;
      }

      // Add web resource button
      if (this.cfg.showAddWebResourceButton) {
        const webBtn = document.createElement("button");
        webBtn.id = "addWebBtn";
        webBtn.className = "add-web-button";
        webBtn.setAttribute("aria-label", "Add web resource");
        webBtn.innerHTML = '<svg viewBox="0 0 200 200"><use xlink:href="#add-link"/></svg>';
        extraButtons.appendChild(webBtn);
        this.addWebBtn = webBtn;
      }

      if (this.cfg.showAddWebResourceButton || this.cfg.showAddAudioRecordButton) {
        dropArea.appendChild(extraButtons);
      }

      // Container for file items
      const itemsContainer = document.createElement("div");
      itemsContainer.className = "file-items";
      itemsContainer.id = "fileItemsContainer";
      dropArea.appendChild(itemsContainer);
      this.fileItemsContainer = itemsContainer;

      this.rootEl.appendChild(dropArea);

      // Hidden file input
      const input = document.createElement("input");
      input.type = "file";
      input.id = "fileInput";
      input.multiple = true;
      input.style.display = "none";
      this.rootEl.appendChild(input);
      this.fileInput = input;
    }

    renderInitialDocuments() {
      // Clear existing documents (should be empty on init, but for safety)
      while (this.fileItemsContainer.firstChild) {
        this.fileItemsContainer.removeChild(this.fileItemsContainer.firstChild);
      }

      this.documents.forEach((doc) => {
        const el = this.createItemElement(doc);
        this.fileItemsContainer.appendChild(el);
      });
      this.recalcDocuments();
    }

    getFilesSnapshot() {
      return [...this.documents];
    }

    getFileIcon(format) {
      if (format === 'web') {
        return '<svg viewBox="0 0 200 200"><use xlink:href="#doc-link"/></svg>';
      }

      if (format && format.includes('/')) {
        const textIcon = '<svg viewBox="0 0 24 24"><use xlink:href="#doc-text"/></svg>';

        const textMimeTypes = [
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.oasis.opendocument.text',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (textMimeTypes.includes(format.toLowerCase())) {
          return textIcon;
        }

        const mimePrefix = format.split('/')[0].toLowerCase();
        const iconMap = {
          'audio': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-audio"/></svg>',
          'image': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-image"/></svg>',
          'video': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-video"/></svg>',
          'text': textIcon,
          'application': textIcon
        };
        return iconMap[mimePrefix] || '<svg viewBox="0 0 24 24"><use xlink:href="#doc-unknown"/></svg>';
      }

      const legacyIconMap = {
        'audio': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-audio"/></svg>',
        'image': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-image"/></svg>',
        'link': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-link"/></svg>',
        'text': '<svg viewBox="0 0 24 24"><use xlink:href="#doc-text"/></svg>',
        'video': '<svg viewBox="0 0 200 200"><use xlink:href="#doc-video"/></svg>',
        'file': '<svg viewBox="0 0 24 24"><use xlink:href="#doc-text"/></svg>'
      };
      return legacyIconMap[format] || '<svg viewBox="0 0 24 24"><use xlink:href="#doc-unknown"/></svg>';
    }


    setup_native_overflow_tooltip(el) {
      const apply_title = () => {
        el.title = el.scrollWidth > el.clientWidth ? el.textContent : '';
      };

      el.addEventListener('mouseenter', apply_title);

      apply_title();
    }



    recalcDocuments() {
      const items = this.fileItemsContainer.querySelectorAll(".file-item");
      items.forEach((item, i) => {
        const docId = item.dataset.id;
        const doc = this.documents.find(d => d.id === docId);
        
        if (!doc) return; // Skip if document not found
        
        const desc = doc.description;
        const name = doc.fileName || doc.url;
        const mask = this.cfg.localization.defaultDescriptionMask.replace("{{n}}", i + 1);
        const content = item.querySelector(".file-content");
        // Clear previous
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }
        // File name
        const nameSpan = document.createElement("span");
        nameSpan.className = "file-name";
        nameSpan.textContent = name;
        content.appendChild(nameSpan);
        this.setup_native_overflow_tooltip(nameSpan);
        // Description - need to get per-document setting from document object
        const showDesc = doc.showDescription !== undefined ?
          doc.showDescription : this.cfg.showDescription;
        if (showDesc) {
          const descSpan = document.createElement("span");
          descSpan.className = "description" + (desc ? "" : " mock-description");
          descSpan.textContent = desc || mask;
          content.appendChild(descSpan);
        }
      });
    }

    createItemElement(doc) {
      const {
        format,
        fileName,
        description = "",
        url
      } = doc;
      const div = document.createElement("div");
      div.className = "file-item";
      div.dataset.id = doc.id;

      // Icon
      const showIcon = doc.showDocumentIcon !== undefined ? doc.showDocumentIcon : this.cfg.showDocumentIcon;
      if (showIcon) {
        const icon = document.createElement("span");
        icon.className = "file-icon";
        const iconSvg = this.getFileIcon(format);
        icon.innerHTML = iconSvg;
        div.appendChild(icon);
      }

      // Content container
      const contentContainer = document.createElement("div");
      contentContainer.className = "file-content";
      div.appendChild(contentContainer);

      const canEdit = doc.canEdit !== undefined ? doc.canEdit : this.cfg.canEdit;
      const canDelete = doc.canDelete !== undefined ? doc.canDelete : this.cfg.canDelete;

      if (canEdit || canDelete) {
        const actionsContainer = document.createElement("div");
        actionsContainer.style.display = "flex";

        if (canEdit) {
          const editBtn = document.createElement("button");
          editBtn.className = "action-button";
          editBtn.innerHTML = '<svg viewBox="0 0 200 200"><use xlink:href="#edit-pencil"/></svg>';
          editBtn.setAttribute("aria-label", "Edit");
          actionsContainer.appendChild(editBtn);
        }

        if (canDelete) {
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "action-button";
          deleteBtn.innerHTML = '<svg viewBox="0 0 20 20"><use xlink:href="#delete-cross"/></svg>';
          deleteBtn.setAttribute("aria-label", "Delete");
          actionsContainer.appendChild(deleteBtn);
        }

        div.appendChild(actionsContainer);
      }

      // Click event
      const canClick = doc.canClick !== undefined ? doc.canClick : this.cfg.canClick;
      if (canClick) {
        div.addEventListener("click", () => {
          window.parent.postMessage({
            type: "documentClicked",
            appName: "scPostMessage",
            ...this.relayToComponentSnippet,
            payload: {
              documents: this.getFilesSnapshot(),
              index: [...this.fileItemsContainer.children].indexOf(div)
            },
          },
            "*"
          );
        });
      }

      this.attachItemMenu(div);
      return div;
    }

    attachItemMenu(item) {
      const editBtn = item.querySelector(".action-button[aria-label='Edit']");
      const deleteBtn = item.querySelector(".action-button[aria-label='Delete']");

      editBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = [...this.fileItemsContainer.children].indexOf(item);
        window.parent.postMessage({
          type: "editDocumentRequest",
          appName: "scPostMessage",
          ...this.relayToComponentSnippet,
          payload: {
            documents: this.getFilesSnapshot(),
            index
          },
        },
          "*"
        );
      });

      deleteBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = [...this.fileItemsContainer.children].indexOf(item);
        const docId = item.dataset.id;
        const deletedDoc = this.documents.find(doc => doc.id === docId);
        
        this.documents = this.documents.filter(doc => doc.id !== docId);
        
        item.remove();
        this.recalcDocuments();
        window.parent.postMessage({
          type: "documentsChanged",
          appName: "scPostMessage",
          ...this.relayToComponentSnippet,
          payload: {
            documents: this.getFilesSnapshot(),
            actionType: "delete",
            deletedDoc,
            deletedIndex: idx
          },
        },
          "*"
        );
      });
    }

    bindStaticEvents() {
      this.fileSelectLink = this.rootEl.querySelector("#fileSelectLink");
      this.fileSelectLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.fileInput.click();
      });
      this.fileInput.addEventListener("change", (e) => this.uploadFiles(Array.from(e.target.files)));

      let dragCounter = 0;

      this.fileDropArea.addEventListener("dragenter", (e) => {
        e.preventDefault();
        dragCounter++;
        if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file')) {
          e.dataTransfer.dropEffect = "copy";
          this.fileDropArea.classList.add("dragover");
          console.log("dragenter: added dragover class, counter:", dragCounter);
        }
      });

      this.fileDropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file')) {
          e.dataTransfer.dropEffect = "copy";
        }
      });

      this.fileDropArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
          this.fileDropArea.classList.remove("dragover");
          console.log("dragleave: removed dragover class, counter:", dragCounter);
        }
      });

      this.fileDropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dragCounter = 0;
        this.fileDropArea.classList.remove("dragover");
        console.log("drop: removed dragover class");

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.uploadFiles(Array.from(e.dataTransfer.files));
        }
      });

      this.addWebBtn?.addEventListener("click", () => {
        window.parent.postMessage({
          type: "addWebResourceRequest",
          appName: "scPostMessage",
          ...this.relayToComponentSnippet,
          payload: {
            documents: this.getFilesSnapshot()
          },
        },
          "*"
        );
      });

      this.addAudioBtn?.addEventListener("click", () => {
        window.parent.postMessage({
          type: "addAudioRecordRequest",
          appName: "scPostMessage",
          ...this.relayToComponentSnippet,
          payload: {
            documents: this.getFilesSnapshot()
          },
        },
          "*"
        );
      });
    }

    initSortable() {
      let initialOrder = [];

      Sortable.create(this.fileItemsContainer, {
        animation: 150,
        ghostClass: "sortable-ghost",
        onStart: () => {
          initialOrder = Array.from(this.fileItemsContainer.children);
        },
        onEnd: () => {
          this.recalcDocuments();

          const currentOrder = Array.from(this.fileItemsContainer.children);
          const orderChanged = !initialOrder.every((node, index) => node === currentOrder[index]);

          if (orderChanged) {
            const newOrderIds = currentOrder.map(element => element.dataset.id);
            
            this.documents = newOrderIds.map(id => 
              this.documents.find(doc => doc.id === id)
            ).filter(Boolean);

            window.parent.postMessage({
              type: "documentsChanged",
              appName: "scPostMessage",
              ...this.relayToComponentSnippet,
              payload: {
                documents: this.getFilesSnapshot(),
                actionType: "reorder"
              },
            },
              "*"
            );
          }
        },
      });
    }

    applyOverlay() {
      if (!this.pendingOverlay) {
        const overlay = document.createElement("div");
        overlay.className = "file-drop-overlay";
        this.fileDropArea.appendChild(overlay);
        this.pendingOverlay = overlay;
      }
    }

    removeOverlay() {
      if (this.pendingOverlay) {
        this.pendingOverlay.remove();
        this.pendingOverlay = null;
      }
    }

    uploadFiles(files) {
      if (this.getFilesSnapshot().length + files.length > this.cfg.fileLimit) {
        const msg = this.cfg.localization.fileLimitExceeded.replace("{{limit}}", this.cfg.fileLimit);
        alert(msg);
        return;
      }
      this.applyOverlay();
      // Reset tracking
      this.pendingRequests.clear();
      this.uploadResults = {};

      files.forEach((file) => {
        // generate unique requestId
        const requestId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "req_" + Date.now() + "_" + Math.random().toString(16).slice(2);
        this.pendingRequests.add(requestId);

        // send upload request without appName
        window.parent.postMessage({
          type: "uploadFileRequest",
          payload: {
            requestId,
            file: file
          },
        },
          "*"
        );
      });
    }

    onHostMessage({
      data
    }) {
      const value = data.id ? data.value : data;
      const { type, payload } = value || {};
      switch (type) {
        case "fileUploaded": {
          const {
            requestId,
            fileData
          } = payload;
          
          const newDoc = this.ensureDocumentIds([{
            format: fileData.data.type,        // MIME type from simulator
            fileName: fileData.data.title,     // Display name from simulator
            url: `https://sim.simulator.company/api/1.0/download/${fileData.data.fileName}?preview=true`,  // Full URL using download API template
            description: "",
            ...(fileData.data.canEdit !== undefined && { canEdit: fileData.data.canEdit }),
            ...(fileData.data.canDelete !== undefined && { canDelete: fileData.data.canDelete }),
            ...(fileData.data.canClick !== undefined && { canClick: fileData.data.canClick }),
            ...(fileData.data.showDocumentIcon !== undefined && { showDocumentIcon: fileData.data.showDocumentIcon }),
            ...(fileData.data.showDescription !== undefined && { showDescription: fileData.data.showDescription })
          }])[0];
          
          this.documents.push(newDoc);
          
          const element = this.createItemElement(newDoc);
          this.fileItemsContainer.appendChild(element);
          this.recalcDocuments();
          // store result
          this.uploadResults[requestId] = fileData.data;
          this.pendingRequests.delete(requestId);

          if (this.pendingRequests.size === 0) {
            this.removeOverlay();
            // send unified documentsChanged
            window.parent.postMessage({
              type: "documentsChanged",
              appName: "scPostMessage",
              ...this.relayToComponentSnippet,
              payload: {
                documents: this.getFilesSnapshot(),
                actionType: "add",
                addedDocuments: Object.values(this.uploadResults),
              },
            },
              "*"
            );
          }
        }
          break;

        case "fileUploadError": {
          // handle error for a specific requestId if needed
          const {
            requestId,
            error
          } = payload;
          console.error(`Upload failed [${requestId}]:`, error);
          this.pendingRequests.delete(requestId);
          if (this.pendingRequests.size === 0) {
            this.removeOverlay();
          }
        }
          break;

        case "changeDocuments": {
          const {
            documents
          } = payload;
          
          this.documents = this.ensureDocumentIds(documents);
          
          while (this.fileItemsContainer.firstChild) {
            this.fileItemsContainer.removeChild(this.fileItemsContainer.firstChild);
          }
          this.documents.forEach((doc) => {
            const el = this.createItemElement(doc);
            this.fileItemsContainer.appendChild(el);
          });
          this.recalcDocuments();
        }
          break;

        // existing cases for editDescription handled elsewhere

        default:
          break;
      }
    }
  }

  // Initialization example in host page context
  new DocumentManager(document.getElementById("documentManagerHost"), documents, config);
  console.log("Document Manager initialized")
}

const javaScript = `
const documents = ${JSON.stringify(documents, null, 2)};
const config = ${JSON.stringify(config, null, 2)};

(${script.toString()})(documents, config);`;




data.javaScript = javaScript;
