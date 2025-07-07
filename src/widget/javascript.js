const documents = data.__request.query_params?.documents || [];
const config = data.__request.query_params?.config || {};




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

      this.renderSkeleton();
      this.bindStaticEvents();
      this.relayToComponentSnippet = this.cfg.relayToComponentId ? {
        relayToComponentId: this.cfg.relayToComponentId
      } : {};
      if (this.cfg.canReorder) this.initSortable();
      window.addEventListener("message", this.onHostMessage.bind(this));

      if (documents && documents.length > 0) {
        this.renderInitialDocuments(documents);
      }
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

    renderInitialDocuments(documents) {
      // Clear existing documents (should be empty on init, but for safety)
      while (this.fileItemsContainer.firstChild) {
        this.fileItemsContainer.removeChild(this.fileItemsContainer.firstChild);
      }

      documents.forEach((doc) => {
        const el = this.createItemElement({
          title: doc.fileName || doc.url,
          format: doc.format,
          fileName: doc.fileName,
          url: doc.url,
          description: doc.description,
          ...(doc.canEdit !== undefined && { canEdit: doc.canEdit }),
          ...(doc.canDelete !== undefined && { canDelete: doc.canDelete }),
          ...(doc.canClick !== undefined && { canClick: doc.canClick }),
          ...(doc.showDocumentIcon !== undefined && { showDocumentIcon: doc.showDocumentIcon }),
          ...(doc.showDescription !== undefined && { showDescription: doc.showDescription })
        });
        this.fileItemsContainer.appendChild(el);
      });
      this.recalcDocuments();
    }

    getFilesSnapshot() {
      return Array.from(this.fileItemsContainer.querySelectorAll(".file-item")).map((item, i) => {
        const doc = {
          index: i,
          format: item.dataset.format,
          description: item.dataset.description || "",
        };

        if (item.dataset.fileName && item.dataset.fileName.trim() !== "") {
          doc.fileName = item.dataset.fileName;
        }

        if (item.dataset.url && item.dataset.url.trim() !== "") {
          doc.url = item.dataset.url;
        }

        return doc;
      });
    }

    getFileIcon(format) {
      if (format === 'text/html' || format === 'application/xhtml+xml') {
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

      return '<svg viewBox="0 0 24 24"><use xlink:href="#doc-unknown"/></svg>';
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
        const desc = item.dataset.description;
        const name = item.dataset.fileName || item.dataset.url;
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
        // Description - need to get per-document setting from dataset
        const showDesc = item.dataset.showDescription !== undefined ?
          item.dataset.showDescription === 'true' : this.cfg.showDescription;
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
      div.dataset.fileName = fileName || "";
      div.dataset.description = description;
      div.dataset.url = url || "";
      div.dataset.format = format;
      div.dataset.showDescription = doc.showDescription !== undefined ? doc.showDescription.toString() : this.cfg.showDescription.toString();

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
        const deletedDoc = {
          fileName: item.dataset.fileName,
          url: item.dataset.url,
          description: item.dataset.description
        };
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
          // create element for this file
          const element = this.createItemElement({
            format: fileData.data.type,        // MIME type from simulator
            fileName: fileData.data.title,     // Display name from simulator
            url: `https://sim.simulator.company/api/1.0/download/${fileData.data.fileName}?preview=true`,  // Full URL using download API template
            description: "",
            ...(fileData.data.canEdit !== undefined && { canEdit: fileData.data.canEdit }),
            ...(fileData.data.canDelete !== undefined && { canDelete: fileData.data.canDelete }),
            ...(fileData.data.canClick !== undefined && { canClick: fileData.data.canClick }),
            ...(fileData.data.showDocumentIcon !== undefined && { showDocumentIcon: fileData.data.showDocumentIcon }),
            ...(fileData.data.showDescription !== undefined && { showDescription: fileData.data.showDescription })
          });
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
          // clear and render new list
          while (this.fileItemsContainer.firstChild) {
            this.fileItemsContainer.removeChild(this.fileItemsContainer.firstChild);
          }
          documents.forEach((doc) => {
            const el = this.createItemElement({
              format: doc.format,
              fileName: doc.fileName,
              url: doc.url,
              description: doc.description,
              ...(doc.canEdit !== undefined && { canEdit: doc.canEdit }),
              ...(doc.canDelete !== undefined && { canDelete: doc.canDelete }),
              ...(doc.canClick !== undefined && { canClick: doc.canClick }),
              ...(doc.showDocumentIcon !== undefined && { showDocumentIcon: doc.showDocumentIcon }),
              ...(doc.showDescription !== undefined && { showDescription: doc.showDescription })
            });
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
